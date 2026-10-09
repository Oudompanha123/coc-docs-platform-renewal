import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { DisabledMembersPanel } from "./DisabledMembersPanel";
import { RemoveMemberModal } from "./RemoveMemberModal";

// req: FR-USAGE-001, ADR-035

const gone = {
  id: "m-gone",
  email: "gone@example.com",
  displayName: "Gone Person",
  status: "removed",
  avatarUrl: null,
} as unknown as ClaudeUsageMember;

describe("DisabledMembersPanel", () => {
  it("renders nothing when nobody is disabled", () => {
    const { container } = render(<DisabledMembersPanel members={[]} onSelect={vi.fn()} onEnable={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists disabled members when expanded, and enables or opens one", async () => {
    const onSelect = vi.fn();
    const onEnable = vi.fn();
    const user = userEvent.setup();
    render(<DisabledMembersPanel members={[gone]} onSelect={onSelect} onEnable={onEnable} />);

    expect(screen.getByText("Disabled members (1)")).toBeInTheDocument();
    expect(screen.queryByText("gone@example.com")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Disabled members/ }));
    await user.click(screen.getByRole("button", { name: "Enable" }));
    expect(onEnable).toHaveBeenCalledWith(gone);

    await user.click(screen.getByText("Gone Person"));
    expect(onSelect).toHaveBeenCalledWith(gone, expect.any(String));
  });
});

describe("RemoveMemberModal wording", () => {
  it("says Disable stops future tracking and hides them, keeps earlier history, and promises nothing for the gap", () => {
    render(<RemoveMemberModal member={gone} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText(/will stop being tracked/)).toBeInTheDocument();
    expect(screen.getByText(/uploads, scan check-ins and scan logs will be refused/)).toBeInTheDocument();
    expect(screen.getByText(/per-user table, the chart, token and cost totals/)).toBeInTheDocument();
    expect(screen.getByText("Usage collected before now is kept. Nothing is deleted.")).toBeInTheDocument();
    expect(screen.getByText(/Usage from while they are disabled is not recorded — not even after you enable them/)).toBeInTheDocument();
    expect(screen.getByText(/A new report never enables them/)).toBeInTheDocument();
    expect(screen.getByText(/show their earlier history again/)).toBeInTheDocument();
    expect(screen.getByText(/New usage is recorded from the day after you enable them/)).toBeInTheDocument();
  });
});
