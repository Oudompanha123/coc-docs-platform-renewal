import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanLogDetail, ScanLogList } from "@/lib/admin/claudeUsage";
import { scanLog } from "@/lib/claudeUsage/scanLogs.fixture";
import { ScanLogsView } from "./ScanLogsView";

// req: FR-USAGE-002, ADR-096

const { fetchScanLogs, fetchScanLogDetail } = vi.hoisted(() => ({
  fetchScanLogs: vi.fn(),
  fetchScanLogDetail: vi.fn(),
}));
vi.mock("@/lib/admin/claudeUsage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/claudeUsage")>()),
  fetchScanLogs,
  fetchScanLogDetail,
}));
vi.mock("@/components/layout/AppShell", () => ({
  AppShell: ({ pageTitle, pageSubtitle, children }: { pageTitle: string; pageSubtitle: string; children: ReactNode }) => (
    <div>
      <h1>{pageTitle}</h1>
      <p>{pageSubtitle}</p>
      {children}
    </div>
  ),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/claude-usage/logs" }));

const list = (logs = [scanLog()]): ScanLogList => ({ from: "2026-10-01", to: "2026-10-07", logs, truncated: false });

const failed = scanLog({
  id: "log-2",
  memberId: "m-2",
  email: "dara@example.com",
  displayName: "Dara",
  status: "failed",
  uploadStatus: "failed",
  newTokens: 120,
  daysUploaded: 0,
  errorStep: "upload",
  errorMessage: "upload failed for 2026-10-07: nothing is listening at https://docs.example/api/ingest. Is the Coc Docs backend running?",
});
const noNewUsage = scanLog({ id: "log-3", uploadStatus: "not-needed", newTokens: 0 });

/** The value shown on a summary card, found by its label. */
function card(label: string): string {
  const labelEl = screen.getByText(label, { selector: "p" });
  return labelEl.closest("div.rounded-\\[10px\\]")!.querySelector("p.text-3xl")!.textContent!;
}

describe("ScanLogsView", () => {
  beforeEach(() => {
    fetchScanLogs.mockReset();
    fetchScanLogDetail.mockReset();
  });

  it("shows a loading state, then the title, summary cards and one row per scan", async () => {
    let resolve!: (value: ScanLogList) => void;
    fetchScanLogs.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ScanLogsView />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading scan logs…");
    expect(screen.getByRole("heading", { name: "View Logs" })).toBeInTheDocument();
    expect(screen.getByText("Monitor Claude Usage scan activity and troubleshoot scan failures.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Logs" })).toHaveAttribute("aria-current", "page");

    resolve(list([scanLog(), failed, noNewUsage]));
    await screen.findByText("Scan history");

    expect(card("Total Scans")).toBe("3");
    expect(card("Successful")).toBe("2");
    expect(card("Warnings")).toBe("0");
    expect(card("Failed")).toBe("1");
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[1]!).getByText("Failed")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("at Upload Usage / Check-in")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Success")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("No new usage")).toBeInTheDocument();
  });

  it("no new usage counts as successful, never as a warning or failure", async () => {
    fetchScanLogs.mockResolvedValue(list([noNewUsage]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    expect(card("Successful")).toBe("1");
    expect(card("Warnings")).toBe("0");
    expect(card("Failed")).toBe("0");
  });

  it("an empty range shows the empty state, not a blank table", async () => {
    fetchScanLogs.mockResolvedValue(list([]));
    render(<ScanLogsView />);
    expect(await screen.findByText("No scan logs yet")).toBeInTheDocument();
    expect(screen.getByText(/Scan activity will appear here when users run Claude Usage\./)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("filters by status and search, with a way back when nothing matches", async () => {
    fetchScanLogs.mockResolvedValue(list([scanLog(), failed]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "failed" } });
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(card("Successful")).toBe("1"); // the cards ignore the status filter

    fireEvent.change(screen.getByLabelText("Search scan logs"), { target: { value: "nobody-matches-this" } });
    expect(screen.getByText("No scans match these filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("a load failure says so and can be retried", async () => {
    fetchScanLogs.mockRejectedValueOnce(new Error("Couldn't reach the server.")).mockResolvedValueOnce(list());
    render(<ScanLogsView />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load scan logs: Couldn't reach the server.");
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    await screen.findByText("Scan history");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("asks the server for the chosen date range", async () => {
    fetchScanLogs.mockResolvedValue(list());
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    fireEvent.change(screen.getByLabelText("Date range"), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-09-02" } });
    await waitFor(() => expect(fetchScanLogs).toHaveBeenLastCalledWith("2026-09-01", "2026-09-02"));
  });

  describe("detail", () => {
    const detail: ScanLogDetail = {
      summary: failed,
      steps: [
        { key: "start", status: "success", at: failed.startedAt, detail: "Started by the daily schedule" },
        { key: "find-transcripts", status: "success", at: failed.startedAt, detail: "118 transcript file(s) found" },
        { key: "parse-usage", status: "success", at: failed.startedAt, detail: "127 usage line(s) read" },
        { key: "deduplicate", status: "success", at: failed.startedAt, detail: "163 duplicate record(s) merged" },
        { key: "calculate-usage", status: "success", at: failed.startedAt, detail: "15,240 token(s) across 1 day(s)" },
        { key: "check-new-usage", status: "success", at: failed.startedAt, detail: "1 day(s) to report" },
        { key: "upload", status: "failed", at: failed.finishedAt, detail: "upload failed for 2026-10-07" },
        { key: "complete", status: "skipped", at: null, detail: "" },
      ],
    };

    it("loads the timeline, and shows where a failed scan stopped and why", async () => {
      fetchScanLogs.mockResolvedValue(list([failed]));
      let resolve!: (value: ScanLogDetail) => void;
      fetchScanLogDetail.mockReturnValue(new Promise((r) => (resolve = r)));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");

      fireEvent.click(screen.getByRole("button", { name: /View details of the scan by Dara/ }));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Loading scan steps…")).toBeInTheDocument();
      expect(within(dialog).getByText(failed.scanRef)).toBeInTheDocument();
      expect(fetchScanLogDetail).toHaveBeenCalledWith("log-2");

      resolve(detail);
      const steps = await within(dialog).findAllByRole("listitem");
      expect(steps).toHaveLength(8);
      expect(within(steps[6]!).getByRole("img", { name: "Failed" })).toBeInTheDocument();
      expect(within(steps[7]!).getByText("Not run.")).toBeInTheDocument();
      expect(within(dialog).getByText("Error")).toBeInTheDocument();
      expect(within(dialog).getAllByText("Upload Usage / Check-in").length).toBeGreaterThan(0);
      expect(within(dialog).getByText(/nothing is listening at/)).toBeInTheDocument();
    });

    it("a detail that cannot load says so in place of the timeline", async () => {
      fetchScanLogs.mockResolvedValue(list([failed]));
      fetchScanLogDetail.mockRejectedValue(new Error("scan log not found"));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");
      fireEvent.click(screen.getByRole("button", { name: /View details of the scan by Dara/ }));
      const dialog = screen.getByRole("dialog");
      expect(await within(dialog).findByText("scan log not found")).toBeInTheDocument();
    });
  });
});
