import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityDigestCard } from "./ActivityDigestCard";
import type { Role } from "@/lib/auth/api";

const sendActivityDigest = vi.hoisted(() => vi.fn());
const useSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/notifications", () => ({ sendActivityDigest }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

/** Signs the test in as `role`, the way SessionProvider would have. */
function signedInAs(role: Role) {
  useSession.mockReturnValue({
    status: "authenticated",
    user: { id: "1", email: "boss@example.com", displayName: "Boss", role },
  });
}

const SEND = { name: "Send digest now" };

/** Mirrors ActivityDigestCard's own `todayLocal()`, so this test stays
 *  correct on whatever day it actually runs rather than pinning a date that
 *  goes stale. */
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("ActivityDigestCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedInAs("super_admin");
    sendActivityDigest.mockResolvedValue({
      day: "2026-09-14",
      sent: true,
      pagesChanged: 3,
      sections: 2,
      recipients: 4,
      reason: "sent",
    });
  });

  it("is hidden from an admin, who would only get a 403 from the button", () => {
    signedInAs("admin");
    const { container } = render(<ActivityDigestCard />);

    // Nothing at all — not an empty card with a heading over it.
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden from an ordinary user", () => {
    signedInAs("user");
    const { container } = render(<ActivityDigestCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("defaults the day field to today once mounted, for convenience", async () => {
    render(<ActivityDigestCard />);

    expect(await screen.findByLabelText("Day to report on")).toHaveValue(todayLocal());
  });

  it("sends today when the prefilled field is left as-is", async () => {
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await screen.findByDisplayValue(todayLocal());
    await user.click(screen.getByRole("button", SEND));

    expect(sendActivityDigest).toHaveBeenCalledWith(todayLocal());
  });

  it("sends no day when the field is cleared, so the backend picks yesterday", async () => {
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    const field = await screen.findByLabelText("Day to report on");
    await user.clear(field);
    await user.click(screen.getByRole("button", SEND));

    // undefined, not a date computed here: the report's day is resolved in the
    // backend's timezone, which is not necessarily the browser's.
    expect(sendActivityDigest).toHaveBeenCalledWith(undefined);
  });

  it("sends the chosen day", async () => {
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    const field = await screen.findByLabelText("Day to report on");
    await user.clear(field);
    await user.type(field, "2026-09-01");
    await user.click(screen.getByRole("button", SEND));

    expect(sendActivityDigest).toHaveBeenCalledWith("2026-09-01");
  });

  it("reports a successful send with its recipient count", async () => {
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));

    expect(await screen.findByText("Sent to 4 recipients")).toBeInTheDocument();
    expect(screen.getByText(/3 pages across 2 sections/)).toBeInTheDocument();
  });

  it("says a single recipient in the singular", async () => {
    sendActivityDigest.mockResolvedValue({
      day: "2026-09-14",
      sent: true,
      pagesChanged: 1,
      sections: 1,
      recipients: 1,
      reason: "sent",
    });
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));

    expect(await screen.findByText("Sent to 1 recipient")).toBeInTheDocument();
  });

  it("shows 'nothing was sent' with the backend's reason, not as an error", async () => {
    sendActivityDigest.mockResolvedValue({
      day: "2026-09-14",
      sent: false,
      pagesChanged: 0,
      sections: 0,
      recipients: 0,
      reason: "no page activity on this day",
    });
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));

    // A quiet day is a normal outcome, so it reads as information rather than
    // a failure — and it still says which of the three "not sent" cases it is.
    expect(await screen.findByText("Nothing was sent")).toBeInTheDocument();
    expect(screen.getByText(/no page activity on this day/)).toBeInTheDocument();
  });

  it("surfaces the backend's refusal wording", async () => {
    sendActivityDigest.mockRejectedValue(
      new Error("cannot send a digest for 2026-12-01, which is in the future"),
    );
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));

    expect(
      await screen.findByText("cannot send a digest for 2026-12-01, which is in the future"),
    ).toBeInTheDocument();
  });

  it("disables the button while sending, so one click cannot send two emails", async () => {
    let release: (value: unknown) => void = () => {};
    sendActivityDigest.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));

    const button = screen.getByRole("button", { name: "Sending…" });
    expect(button).toBeDisabled();

    release({ day: "2026-09-14", sent: true, pagesChanged: 1, sections: 1, recipients: 1, reason: "sent" });
    expect(await screen.findByRole("button", SEND)).toBeEnabled();
  });

  it("clears the previous outcome when sent again", async () => {
    const user = userEvent.setup();
    render(<ActivityDigestCard />);

    await user.click(screen.getByRole("button", SEND));
    expect(await screen.findByText("Sent to 4 recipients")).toBeInTheDocument();

    sendActivityDigest.mockRejectedValue(new Error("Couldn't reach the server."));
    await user.click(screen.getByRole("button", SEND));

    // The stale success must not sit next to the new failure.
    expect(await screen.findByText("Couldn't reach the server.")).toBeInTheDocument();
    expect(screen.queryByText("Sent to 4 recipients")).not.toBeInTheDocument();
  });
});
