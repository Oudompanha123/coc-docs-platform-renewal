import { beforeEach, describe, expect, it, vi } from "vitest";

const ENABLED_KEY = "coc_notifications_enabled";
const TOKEN_KEY = "coc_push_token";

/**
 * What sign-out takes away, and what it must leave alone.
 *
 * <p>Reported as: turn browser notifications on, sign out, sign back in, and
 * the toggle is off again. Sign-out was calling `disableNotifications`, which
 * clears the preference as well as the device token — so the one act meant
 * both "this browser is no longer a destination for that account" and "this
 * person does not want notifications", and only the first is true.
 */
describe("what sign-out does to notification settings", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("drops the device token, because it belongs to the account that just left", async () => {
    // Left behind, it would deliver the previous person's notifications to
    // whoever signs in next on a shared browser.
    localStorage.setItem(TOKEN_KEY, "a-device-token");
    localStorage.setItem(ENABLED_KEY, "1");
    const { unregisterThisDevice } = await import("./push");

    await unregisterThisDevice();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/devices/a-device-token"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("keeps the preference, because wanting banners is not part of a session", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    const { unregisterThisDevice } = await import("./push");

    await unregisterThisDevice();

    // The browser permission behind this survives sign-out anyway — it is
    // granted per origin, not per login — so clearing our flag only made the
    // toggle disagree with the browser.
    expect(localStorage.getItem(ENABLED_KEY)).toBe("1");
  });

  it("turning it off deliberately does clear the preference", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    localStorage.setItem(TOKEN_KEY, "a-device-token");
    const { disableNotifications } = await import("./push");

    await disableNotifications();

    // The distinction the two functions exist for: this is somebody saying
    // they do not want them, and it should survive their next sign-in exactly
    // as turning it on does.
    expect(localStorage.getItem(ENABLED_KEY)).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("signing out with nothing registered is not an error", async () => {
    const { unregisterThisDevice } = await import("./push");

    await expect(unregisterThisDevice()).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
