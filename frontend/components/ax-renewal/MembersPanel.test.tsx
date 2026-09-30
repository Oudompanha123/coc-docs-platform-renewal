import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ax-renewal/api", () => ({
  addMember: vi.fn(),
  removeMember: vi.fn(),
}));

import { addMember, removeMember, type AxRenewalMember } from "@/lib/ax-renewal/api";
import { MembersPanel } from "./MembersPanel";

/**
 * The Members panel (ADR-069): readable by everyone who can open the
 * project, managed only by someone who may change it. The backend refuses
 * add/remove from anyone else regardless — these pin that the controls are
 * not offered where they could only be refused.
 */
describe("MembersPanel", () => {
  const me: AxRenewalMember = { accountId: "u1", displayName: "Dara", addedAt: "2026-09-01T00:00:00Z" };
  const teammate: AxRenewalMember = { accountId: "u2", displayName: "Sokha", addedAt: "2026-09-02T00:00:00Z" };

  beforeEach(() => vi.clearAllMocks());

  function renderPanel(members: AxRenewalMember[], canManage: boolean, onChanged = vi.fn().mockResolvedValue(undefined)) {
    render(
      <MembersPanel projectId="p1" members={members} currentUserId="u1" canManage={canManage} onChanged={onChanged} />,
    );
    return onChanged;
  }

  it("lists members by display name and marks the caller", () => {
    renderPanel([me, teammate], false);

    const list = screen.getByRole("list", { name: "Project members" });
    expect(list).toHaveTextContent("Dara");
    expect(list).toHaveTextContent("Sokha");
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("offers no add or remove to someone who cannot manage the team", () => {
    renderPanel([me, teammate], false);

    expect(screen.queryByRole("button", { name: /Add member/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("adds by email, then refreshes", async () => {
    vi.mocked(addMember).mockResolvedValue([me, teammate]);
    const onChanged = renderPanel([me], true);

    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: " sokha@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: /Add member/ }));

    await waitFor(() => expect(addMember).toHaveBeenCalledWith("p1", "sokha@example.com"));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("shows why an add was refused", async () => {
    vi.mocked(addMember).mockRejectedValue(new Error("that account cannot open AX Renewal."));
    renderPanel([me], true);

    fireEvent.change(screen.getByLabelText(/Email address/), { target: { value: "plain@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Add member/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("cannot open AX Renewal");
  });

  it("takes two presses to remove someone, never one", async () => {
    vi.mocked(removeMember).mockResolvedValue(undefined);
    renderPanel([me, teammate], true);

    fireEvent.click(screen.getByRole("button", { name: "Remove Sokha" }));
    expect(removeMember).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm removing Sokha" }));
    await waitFor(() => expect(removeMember).toHaveBeenCalledWith("p1", "u2"));
  });

  it("does not offer to remove the last member, and says why", () => {
    renderPanel([me], true);

    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.getByText(/at least one member/)).toBeInTheDocument();
  });
});
