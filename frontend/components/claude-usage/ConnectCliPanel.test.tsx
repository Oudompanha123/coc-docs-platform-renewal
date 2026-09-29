import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectCliPanel } from "./ConnectCliPanel";

// req: FR-USAGE-002, ADR-060

const { listUsageTokens, revokeUsageToken } = vi.hoisted(() => ({
  listUsageTokens: vi.fn(),
  revokeUsageToken: vi.fn(),
}));
vi.mock("@/lib/auth/api", () => ({ listUsageTokens, revokeUsageToken }));

describe("ConnectCliPanel (ADR-060)", () => {
  beforeEach(() => {
    listUsageTokens.mockReset().mockResolvedValue([]);
    revokeUsageToken.mockReset().mockResolvedValue(undefined);
  });

  it("tells the reader to install and scan — there is no setup code to copy", () => {
    render(<ConnectCliPanel />);
    expect(screen.getByText("npm install -g claude-team-usage")).toBeInTheDocument();
    expect(screen.getByText("claude-team-usage scan")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /setup code/i })).toBeNull();
  });

  it("lists connected machines and revokes one", async () => {
    listUsageTokens.mockResolvedValue([{ id: "t9", label: "CLI — dana-laptop", createdAt: "2026-09-20T00:00:00Z", lastUsedAt: null }]);
    render(<ConnectCliPanel />);

    await userEvent.click(await screen.findByRole("button", { name: "Revoke CLI — dana-laptop" }));

    expect(revokeUsageToken).toHaveBeenCalledWith("t9");
  });
});
