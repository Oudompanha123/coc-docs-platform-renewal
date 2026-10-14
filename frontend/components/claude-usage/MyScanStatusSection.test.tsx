import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanLogList } from "@/lib/admin/claudeUsage";
import { scanLog } from "@/lib/claudeUsage/scanLogs.fixture";
import { MyScanStatusSection } from "./MyScanStatusSection";

// req: FR-USAGE-002, ADR-107

const { fetchScanLogs } = vi.hoisted(() => ({ fetchScanLogs: vi.fn() }));
vi.mock("@/lib/admin/claudeUsage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/claudeUsage")>()),
  fetchScanLogs,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const list = (logs = [scanLog()]): ScanLogList => ({ from: "2026-10-01", to: "2026-10-07", logs, truncated: false });

describe("MyScanStatusSection", () => {
  beforeEach(() => {
    fetchScanLogs.mockReset();
  });

  it("reads the caller's own scans, never the team's", async () => {
    fetchScanLogs.mockResolvedValue(list());
    render(<MyScanStatusSection />);
    await screen.findByText("Scan completed successfully");
    expect(fetchScanLogs.mock.calls[0]![2]).toBe("mine");
  });

  it("no scan yet: No Recent Scan", async () => {
    fetchScanLogs.mockResolvedValue(list([]));
    render(<MyScanStatusSection />);
    expect(await screen.findByText("No Recent Scan")).toBeInTheDocument();
  });

  it("a failed latest scan: red status, the plain problem and the first fix, no raw error", async () => {
    fetchScanLogs.mockResolvedValue(
      list([
        scanLog({
          id: "f",
          status: "failed",
          uploadStatus: "failed",
          errorStep: "upload",
          errorMessage: "upload failed for 2026-10-07: rejected (401): your token is invalid",
        }),
        scanLog(),
      ]),
    );
    render(<MyScanStatusSection />);
    const panel = await screen.findByRole("region", { name: /Latest scan/ });
    expect(panel.querySelector('[data-status="failed"]')).toHaveTextContent("Failed");
    expect(within(panel).getByText("Authentication failed")).toBeInTheDocument();
    expect(screen.getByText("claude-team-usage login")).toBeInTheDocument();
    expect(screen.queryByText(/rejected \(401\)/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Recent scans" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("links to the full history only when given somewhere to go", async () => {
    fetchScanLogs.mockResolvedValue(list());
    const { unmount } = render(<MyScanStatusSection />);
    await screen.findByText("Scan completed successfully");
    expect(screen.queryByRole("link", { name: "View all scan logs" })).not.toBeInTheDocument();
    unmount();

    render(<MyScanStatusSection scanLogsHref="/claude-usage/monitoring" />);
    expect(await screen.findByRole("link", { name: "View all scan logs" })).toHaveAttribute("href", "/claude-usage/monitoring");
  });

  it("a load failure says so", async () => {
    fetchScanLogs.mockImplementation(async () => {
      throw new Error("Couldn't reach the server.");
    });
    render(<MyScanStatusSection />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your scans: Couldn't reach the server.");
  });
});
