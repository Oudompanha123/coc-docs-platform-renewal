import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { approveAccount } = vi.hoisted(() => ({ approveAccount: vi.fn() }));
vi.mock("@/lib/admin/accounts", () => ({ approveAccount }));

import { ApproveRegistrationModal } from "./ApproveRegistrationModal";

const google = {
  id: "a",
  email: "dana@example.com",
  displayName: "Dana Lee",
  role: "guest",
  status: "PENDING",
  avatarUrl: "https://lh3.example.com/dana.jpg",
};
const password = { ...google, id: "b", displayName: "Sam Ray", email: "sam@example.com", avatarUrl: null };

describe("ApproveRegistrationModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows who applied, so the decision is not made blind", () => {
    render(<ApproveRegistrationModal account={google} onClose={vi.fn()} onApproved={vi.fn()} />);

    expect(screen.getByText("Dana Lee")).toBeInTheDocument();
    expect(screen.getByText("dana@example.com")).toBeInTheDocument();
  });

  it("uses the Google picture when there is one", () => {
    const { container } = render(
      <ApproveRegistrationModal account={google} onClose={vi.fn()} onApproved={vi.fn()} />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", google.avatarUrl);
  });

  it("falls back to initials for a password registration", () => {
    const { container } = render(
      <ApproveRegistrationModal account={password} onClose={vi.fn()} onApproved={vi.fn()} />,
    );

    // Initials rather than a silhouette: a stand-in face among real people
    // reads as somebody you failed to recognise.
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("SR")).toBeInTheDocument();
  });

  it("approves at the chosen role, not a silent default", async () => {
    approveAccount.mockResolvedValue({});
    const onApproved = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ApproveRegistrationModal account={google} onClose={onClose} onApproved={onApproved} />);

    await user.click(screen.getByRole("radio", { name: /authors, validates and publishes/i }));
    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(approveAccount).toHaveBeenCalledWith("a", "admin"));
    // Both: the caller re-reads the queue so the item leaves the bell, and the
    // dialog closes.
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("defaults to the least a role can be", async () => {
    approveAccount.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ApproveRegistrationModal account={google} onClose={vi.fn()} onApproved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(approveAccount).toHaveBeenCalledWith("a", "user"));
  });

  it("closes without approving when cancelled", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ApproveRegistrationModal account={google} onClose={onClose} onApproved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(approveAccount).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the server's own refusal and keeps the dialog open", async () => {
    approveAccount.mockRejectedValue(new Error("that account is not pending"));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ApproveRegistrationModal account={google} onClose={onClose} onApproved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Approve" }));

    // The wording tells the reader what happened; a generic message does not.
    expect(await screen.findByText("that account is not pending")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
