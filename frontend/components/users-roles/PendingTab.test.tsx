import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PendingAccount } from "@/lib/admin/accounts";
import { PendingTab } from "./PendingTab";

function applicant(overrides: Partial<PendingAccount> = {}): PendingAccount {
  return {
    id: "p1",
    email: "new.person@example.com",
    displayName: "New Person",
    role: "guest",
    avatarUrl: null,
    status: "pending",
    ...overrides,
  };
}

function renderTab(pending: PendingAccount[], handlers: Partial<{ onApprove: () => Promise<void>; onReject: () => Promise<void> }> = {}) {
  const onApprove = vi.fn(handlers.onApprove ?? (() => Promise.resolve()));
  const onReject = vi.fn(handlers.onReject ?? (() => Promise.resolve()));
  render(<PendingTab pending={pending} loading={false} error={null} onApprove={onApprove} onReject={onReject} />);
  return { onApprove, onReject };
}

/** Users & Roles → Pending: who is waiting, and the role to let them in at. */
describe("PendingTab", () => {
  it("offers every role to approve at, User first, each with what it may do", async () => {
    const user = userEvent.setup();
    renderTab([applicant()]);

    await user.click(screen.getByRole("button", { name: "Role for new.person@example.com: User" }));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.map((o) => o.querySelector("span span")?.textContent)).toEqual([
      "User",
      "Developer",
      "Reviewer",
      "Lead",
      "Admin",
      "Super Admin",
    ]);
    expect(screen.getByRole("option", { name: /Developer/ })).toHaveTextContent("Implements AX Renewal plans");
    expect(screen.getByRole("option", { name: /^User/ })).toHaveAttribute("aria-selected", "true");
  });

  it.each([
    ["Developer", "developer"],
    ["Reviewer", "reviewer"],
    ["Lead", "lead"],
  ] as const)("approves at %s", async (label, role) => {
    const user = userEvent.setup();
    const { onApprove } = renderTab([applicant()]);

    await user.click(screen.getByRole("button", { name: /^Role for new.person@example.com/ }));
    await user.click(screen.getByRole("option", { name: new RegExp(`^${label}`) }));
    expect(screen.getByRole("button", { name: `Role for new.person@example.com: ${label}` })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith("p1", role));
  });

  it("approves at User when nothing else is picked", async () => {
    const user = userEvent.setup();
    const { onApprove } = renderTab([applicant()]);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(onApprove).toHaveBeenCalledWith("p1", "user"));
  });

  it("keeps each applicant's role choice to their own row", async () => {
    const user = userEvent.setup();
    const { onApprove } = renderTab([
      applicant(),
      applicant({ id: "p2", email: "second@example.com", displayName: "Second Person" }),
    ]);

    await user.click(screen.getByRole("button", { name: /^Role for second@example.com/ }));
    await user.click(screen.getByRole("option", { name: /^Lead/ }));

    expect(screen.getByRole("button", { name: "Role for new.person@example.com: User" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Approve" })[1]!);
    await waitFor(() => expect(onApprove).toHaveBeenCalledWith("p2", "lead"));
  });

  it("refuses", async () => {
    const user = userEvent.setup();
    const { onReject, onApprove } = renderTab([applicant()]);

    await user.click(screen.getByRole("button", { name: "Refuse" }));

    await waitFor(() => expect(onReject).toHaveBeenCalledWith("p1"));
    expect(onApprove).not.toHaveBeenCalled();
  });

  it("holds the row while a decision is being saved", async () => {
    let finish!: () => void;
    const user = userEvent.setup();
    renderTab([applicant()], { onApprove: () => new Promise<void>((resolve) => (finish = resolve)) });

    await user.click(screen.getByRole("button", { name: "Approve" }));

    expect(screen.getByRole("button", { name: /Approving/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Refuse" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Role for/ })).toBeDisabled();
    finish();
    expect(await screen.findByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("shows the applicant's own picture when they have one", () => {
    renderTab([applicant({ avatarUrl: "https://lh3.googleusercontent.com/a/photo" })]);

    expect(screen.getByRole("img", { name: "New Person" })).toHaveAttribute("src", "https://lh3.googleusercontent.com/a/photo");
  });

  it("shows the default picture for an email registration, which has none", () => {
    renderTab([applicant({ avatarUrl: null })]);

    expect(screen.getByRole("img", { name: "New Person (no profile picture)" })).toBeInTheDocument();
  });

  it("falls back to the default picture when their picture will not load", () => {
    renderTab([applicant({ avatarUrl: "https://lh3.googleusercontent.com/a/expired" })]);

    screen.getByRole("img", { name: "New Person" }).dispatchEvent(new Event("error"));

    return waitFor(() =>
      expect(screen.getByRole("img", { name: "New Person (no profile picture)" })).toBeInTheDocument(),
    );
  });

  it("marks each applicant as awaiting approval", () => {
    renderTab([applicant()]);

    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
  });

  it("says nobody is waiting when the queue is empty", () => {
    renderTab([]);

    expect(screen.getByRole("status")).toHaveTextContent("Nobody is waiting");
    expect(screen.getByRole("status")).toHaveTextContent("by email or with Google");
  });
});
