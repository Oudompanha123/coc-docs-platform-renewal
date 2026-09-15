import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushSupport, isPushEnabled, enablePush, disablePush } = vi.hoisted(() => ({
  pushSupport: vi.fn(),
  isPushEnabled: vi.fn(),
  enablePush: vi.fn(),
  disablePush: vi.fn(),
}));

vi.mock("@/lib/notify/push", () => ({ pushSupport, isPushEnabled, enablePush, disablePush }));

import { PushNotificationsCard } from "./PushNotificationsCard";

const toggle = () => screen.getByRole("switch", { name: /push notifications on this device/i });

describe("PushNotificationsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPushEnabled.mockReturnValue(false);
  });

  it("asks the browser only when the control is pressed", async () => {
    pushSupport.mockReturnValue("ready");
    enablePush.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    // A permission prompt raised on page load is often refused outright, and a
    // refusal cannot be re-raised from script. Nothing may happen on mount.
    expect(enablePush).not.toHaveBeenCalled();

    await user.click(toggle());

    expect(enablePush).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "true"));
  });

  it("stays off when permission is refused", async () => {
    pushSupport.mockReturnValue("ready");
    enablePush.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    await user.click(toggle());

    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "false"));
  });

  it("unregisters this device when switched off", async () => {
    pushSupport.mockReturnValue("ready");
    isPushEnabled.mockReturnValue(true);
    disablePush.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "true"));
    await user.click(toggle());

    expect(disablePush).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "false"));
  });

  /**
   * Each unavailable state has its own sentence. "Notifications are off" when
   * the real answer is "your browser cannot do this" or "this deployment has
   * no Firebase project" sends somebody looking for a setting that would not
   * have helped.
   */
  it("says the site is blocked, and where to fix it", async () => {
    pushSupport.mockReturnValue("denied");
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/blocked for this site/i)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
  });

  it("says when the deployment has no push configured", async () => {
    pushSupport.mockReturnValue("not-configured");
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/not set up for this deployment/i)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
  });

  it("says when the browser simply cannot", async () => {
    pushSupport.mockReturnValue("unsupported");
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/browser cannot show push notifications/i)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
  });
});
