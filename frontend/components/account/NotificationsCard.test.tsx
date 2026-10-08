import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsCard } from "./NotificationsCard";

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "user" as string | undefined } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current } }),
}));

// Each control has its own tests under components/settings — here only which
// of them this tab shows, per role.
vi.mock("@/components/settings/PushNotificationsCard", () => ({
  PushNotificationsCard: () => <div>Push notifications control</div>,
}));
vi.mock("@/components/settings/NotificationsCard", () => ({
  NotificationsCard: () => <div>Notification preferences control</div>,
}));
vi.mock("@/components/settings/MailCredentialCard", () => ({
  MailCredentialCard: () => <div>Mail credential control</div>,
}));

beforeEach(() => {
  sessionRole.current = "user";
});

describe("NotificationsCard (account settings)", () => {
  it("shows a normal user only the browser notifications toggle", () => {
    render(<NotificationsCard />);

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("Push notifications control")).toBeInTheDocument();
    expect(screen.queryByText("Notification preferences control")).not.toBeInTheDocument();
    expect(screen.queryByText("Mail credential control")).not.toBeInTheDocument();
  });

  it.each(["developer", "admin", "super_admin"])("shows %s all three notification controls", (role) => {
    sessionRole.current = role;
    render(<NotificationsCard />);

    expect(screen.getByText("Push notifications control")).toBeInTheDocument();
    expect(screen.getByText("Notification preferences control")).toBeInTheDocument();
    expect(screen.getByText("Mail credential control")).toBeInTheDocument();
  });
});
