import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadMailCredential, saveMailCredential, removeMailCredential } = vi.hoisted(() => ({
  loadMailCredential: vi.fn(),
  saveMailCredential: vi.fn(),
  removeMailCredential: vi.fn(),
}));

vi.mock("@/lib/notify/mailCredential", () => ({
  loadMailCredential,
  saveMailCredential,
  removeMailCredential,
  MailCredentialError: class extends Error {},
}));

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

import { MailCredentialCard } from "./MailCredentialCard";

const setUp = () => screen.getByRole("button", { name: /set up|replace/i });

describe("MailCredentialCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadMailCredential.mockResolvedValue({ configured: false, smtpUsername: null });
    useSession.mockReturnValue({ user: { email: "ana@gmail.com" } });
  });

  it("says nothing is stored, and that the shared address is used instead", async () => {
    render(<MailCredentialCard />);

    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());
    expect(screen.getByText(/sent from the shared address/i)).toBeInTheDocument();
  });

  it("names the address in use once one is stored", async () => {
    loadMailCredential.mockResolvedValue({ configured: true, smtpUsername: "ana@gmail.com" });

    render(<MailCredentialCard />);

    await waitFor(() => expect(screen.getByText(/ana@gmail\.com/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  /**
   * ADR-077 §4.3 made this copy a condition of the decision, not a nicety:
   * nobody but its author was to store a credential until the form said both
   * halves of what one grants. A shorter, friendlier rewrite would quietly
   * undo that, so it is pinned here rather than left to review.
   */
  it("states that the mailbox is read on a schedule, not only sent from", async () => {
    render(<MailCredentialCard />);
    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());

    await userEvent.click(setUp());

    expect(screen.getByText(/read this mailbox on a schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/full read and send on the\s+whole account/i)).toBeInTheDocument();
  });

  /**
   * The address comes from the signed-in account, so the common case is a
   * password and nothing else. Typing it again was the friction this removes.
   */
  it("prefills the address from the account you signed in with", async () => {
    render(<MailCredentialCard />);
    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());

    await userEvent.click(setUp());

    expect(screen.getByLabelText(/gmail address/i)).toHaveValue("ana@gmail.com");
    expect(screen.getByText(/filled in from the account you signed in with/i)).toBeInTheDocument();
    // Only the password is left to supply.
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("prefers the stored address over the login one when replacing", async () => {
    loadMailCredential.mockResolvedValue({ configured: true, smtpUsername: "work@example.com" });

    render(<MailCredentialCard />);
    await waitFor(() => expect(screen.getByText(/work@example\.com/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /replace/i }));

    expect(screen.getByLabelText(/gmail address/i)).toHaveValue("work@example.com");
  });

  it("sends what was typed and then forgets the password", async () => {
    saveMailCredential.mockResolvedValue({ configured: true, smtpUsername: "ana@gmail.com" });

    render(<MailCredentialCard />);
    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());
    await userEvent.click(setUp());

    await userEvent.type(screen.getByLabelText(/app password/i), "abcd efgh ijkl mnop");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(saveMailCredential).toHaveBeenCalledWith("ana@gmail.com", "abcd efgh ijkl mnop"));

    // The form closes and the field is cleared: a password left sitting in
    // component state is one a later render can put back on screen.
    await waitFor(() => expect(screen.queryByLabelText(/app password/i)).not.toBeInTheDocument());
    expect(screen.getByText(/^saved\.$/i)).toBeInTheDocument();
  });

  it("cannot be submitted with either field empty", async () => {
    render(<MailCredentialCard />);
    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());
    await userEvent.click(setUp());

    // The address is prefilled, so what is missing is the password.
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/gmail address/i));
    await userEvent.type(screen.getByLabelText(/app password/i), "abcdefghijklmnop");
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("shows the reason a save was refused", async () => {
    saveMailCredential.mockRejectedValue(new Error("That doesn't look right."));

    render(<MailCredentialCard />);
    await waitFor(() => expect(loadMailCredential).toHaveBeenCalled());
    await userEvent.click(setUp());
    // The address is already prefilled from the session.
    await userEvent.type(screen.getByLabelText(/app password/i), "abcdefghijklmnop");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/that doesn't look right/i)).toBeInTheDocument();
  });

  it("removes a stored credential", async () => {
    loadMailCredential.mockResolvedValue({ configured: true, smtpUsername: "ana@gmail.com" });
    removeMailCredential.mockResolvedValue(undefined);

    render(<MailCredentialCard />);
    await waitFor(() => expect(screen.getByText(/ana@gmail\.com/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    await waitFor(() => expect(removeMailCredential).toHaveBeenCalled());
    expect(await screen.findByText(/sent from the shared address/i)).toBeInTheDocument();
  });

  /**
   * A status read that fails must not block the form: the person can still
   * press Save, and that call reports anything real.
   */
  it("still offers the form when the status cannot be read", async () => {
    loadMailCredential.mockRejectedValue(new Error("offline"));

    render(<MailCredentialCard />);

    await waitFor(() => expect(setUp()).toBeInTheDocument());
  });
});
