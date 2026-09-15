import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  notificationSupport,
  isNotificationsEnabled,
  isBackgroundPushConfigured,
  enableNotifications,
  disableNotifications,
} = vi.hoisted(() => ({
  notificationSupport: vi.fn(),
  isNotificationsEnabled: vi.fn(),
  isBackgroundPushConfigured: vi.fn(),
  enableNotifications: vi.fn(),
  disableNotifications: vi.fn(),
}));

vi.mock("@/lib/notify/push", () => ({
  notificationSupport,
  isNotificationsEnabled,
  isBackgroundPushConfigured,
  enableNotifications,
  disableNotifications,
}));

import { PushNotificationsCard } from "./PushNotificationsCard";

const toggle = () => screen.getByRole("switch", { name: /browser notifications on this device/i });

describe("PushNotificationsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isNotificationsEnabled.mockReturnValue(false);
    isBackgroundPushConfigured.mockReturnValue(false);
  });

  /**
   * The bug this pins. The toggle used to be disabled whenever Firebase was
   * absent, so permission was never requested, so Notification.permission
   * stayed "default" — and the polling alerts, which need no Firebase at all,
   * could never fire either. Nothing appeared and nothing said why.
   */
  it("can be pressed even with no Firebase project, because banners do not need one", async () => {
    notificationSupport.mockReturnValue("ready");
    isBackgroundPushConfigured.mockReturnValue(false);
    enableNotifications.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    await waitFor(() => expect(toggle()).toBeEnabled());
    await user.click(toggle());

    expect(enableNotifications).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "true"));
  });

  it("says how far the alerts reach once on, so the limit is not a surprise", async () => {
    notificationSupport.mockReturnValue("ready");
    isNotificationsEnabled.mockReturnValue(true);
    isBackgroundPushConfigured.mockReturnValue(false);
    render(<PushNotificationsCard />);

    // The difference is invisible until somebody closes the tab and misses one.
    expect(await screen.findByText(/while this app is open\. Alerts when it is closed need a Firebase/i))
      .toBeInTheDocument();
  });

  it("says both are covered when background push is configured", async () => {
    notificationSupport.mockReturnValue("ready");
    isNotificationsEnabled.mockReturnValue(true);
    isBackgroundPushConfigured.mockReturnValue(true);
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/while it is closed/i)).toBeInTheDocument();
  });

  it("asks the browser only when the control is pressed", async () => {
    notificationSupport.mockReturnValue("ready");
    enableNotifications.mockResolvedValue(true);
    render(<PushNotificationsCard />);

    // A prompt raised on page load is often refused outright, permanently.
    await waitFor(() => expect(toggle()).toBeEnabled());
    expect(enableNotifications).not.toHaveBeenCalled();
  });

  it("stays off when permission is refused", async () => {
    notificationSupport.mockReturnValue("ready");
    enableNotifications.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    await user.click(toggle());

    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "false"));
  });

  it("turns alerts off, and unregisters the device", async () => {
    notificationSupport.mockReturnValue("ready");
    isNotificationsEnabled.mockReturnValue(true);
    disableNotifications.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PushNotificationsCard />);

    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "true"));
    await user.click(toggle());

    expect(disableNotifications).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(toggle()).toHaveAttribute("aria-checked", "false"));
  });

  it("says the site is blocked, and where to fix it", async () => {
    notificationSupport.mockReturnValue("denied");
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/blocked for this site/i)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
  });

  it("says when the browser simply cannot", async () => {
    notificationSupport.mockReturnValue("unsupported");
    render(<PushNotificationsCard />);

    expect(await screen.findByText(/browser cannot show notifications/i)).toBeInTheDocument();
    expect(toggle()).toBeDisabled();
  });
});
