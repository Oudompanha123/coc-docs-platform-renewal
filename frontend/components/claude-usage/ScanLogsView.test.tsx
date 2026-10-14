import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { pickOption } from "@/components/ui/select.test-utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanLogDetail, ScanLogList } from "@/lib/admin/claudeUsage";
import { scanLog } from "@/lib/claudeUsage/scanLogs.fixture";
import {
  SCAN_LOG_ACTIVE_POLL_INTERVAL_MS,
  SCAN_LOG_POLL_INTERVAL_MS,
  SCAN_NOTICE_DISMISS_MS,
  ScanLogsView,
} from "./ScanLogsView";

// req: FR-USAGE-002, ADR-099, ADR-107

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
vi.mock("next/navigation", () => ({ usePathname: () => "/claude-usage/monitoring" }));

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
const authFailed = scanLog({
  id: "log-4",
  memberId: "m-3",
  email: "vanna@example.com",
  displayName: "Vanna",
  status: "failed",
  uploadStatus: "failed",
  newTokens: 900,
  daysUploaded: 0,
  errorStep: "upload",
  errorMessage:
    "upload failed for 2026-10-07: rejected (401): your token is invalid or has been revoked. Run `claude-team-usage login` to sign in again.",
});

/** The value shown on a summary card, found by its label. */
function card(label: string): string {
  const labelEl = screen.getByText(label, { selector: "p" });
  return labelEl.closest("[data-slot=card]")!.querySelector("p.text-2xl")!.textContent!;
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
    expect(screen.getByRole("heading", { name: "Scan Logs" })).toBeInTheDocument();
    expect(screen.getByText("View and monitor Claude usage scan activities from all users.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Scan Logs" })).toHaveAttribute("aria-current", "page");

    resolve(list([scanLog(), failed, noNewUsage, authFailed]));
    await screen.findByText("Scan history");

    expect(card("Total Scans")).toBe("4");
    expect(card("Success")).toBe("1");
    expect(card("No New Usage")).toBe("1");
    expect(card("Partial Success")).toBe("1");
    expect(card("Failed")).toBe("1");
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers.slice(0, 7)).toEqual([
      "User",
      "Status",
      "Started At",
      "Completed At",
      "Duration",
      "Records",
      "Error Summary",
    ]);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(4);
    expect(within(rows[0]!).getByText("Success")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("118 files · 127 responses")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("8s")).toBeInTheDocument();
    expect(within(rows[0]!).getByRole("button", { name: /View details/ })).toHaveTextContent("View details");
    expect(within(rows[1]!).getByText("Partial Success")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Upload failed — server unreachable")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("No New Usage")).toBeInTheDocument();
    expect(within(rows[3]!).getByText("Failed")).toBeInTheDocument();
    expect(within(rows[3]!).getByText("Authentication failed")).toBeInTheDocument();
    expect(screen.queryByText(/rejected \(401\)/)).not.toBeInTheDocument(); // the raw error stays out of the table
  });

  it("no new usage is its own outcome, never partial or failed", async () => {
    fetchScanLogs.mockResolvedValue(list([noNewUsage]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    expect(card("No New Usage")).toBe("1");
    expect(card("Partial Success")).toBe("0");
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

    await pickOption(userEvent.setup(), "Status", "Partial Success");
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(card("Success")).toBe("1"); // the cards ignore the status filter

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
    await pickOption(userEvent.setup(), "Date range", "Custom range");
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-09-02" } });
    await waitFor(() => expect(fetchScanLogs).toHaveBeenLastCalledWith("2026-09-01", "2026-09-02", "team"));
  });

  describe("auto-refresh", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows a new scan without a manual Refresh, and the button stays as it was", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchScanLogs.mockResolvedValue(list([scanLog()]));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");
      expect(screen.getAllByRole("row")).toHaveLength(2);

      fetchScanLogs.mockResolvedValue(list([failed, scanLog()]));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SCAN_LOG_POLL_INTERVAL_MS);
      });

      expect(screen.getAllByRole("row")).toHaveLength(3);
      expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled(); // a poll never shows "Refreshing…"
    });

    it("polls the date range currently chosen", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchScanLogs.mockResolvedValue(list());
      render(<ScanLogsView />);
      await screen.findByText("Scan history");
      await pickOption(userEvent.setup({ advanceTimers: vi.advanceTimersByTime }), "Date range", "Custom range");
      fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
      fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-09-02" } });
      await waitFor(() => expect(fetchScanLogs).toHaveBeenLastCalledWith("2026-09-01", "2026-09-02", "team"));

      const calls = fetchScanLogs.mock.calls.length;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(SCAN_LOG_POLL_INTERVAL_MS);
      });
      expect(fetchScanLogs).toHaveBeenCalledTimes(calls + 1);
      expect(fetchScanLogs).toHaveBeenLastCalledWith("2026-09-01", "2026-09-02", "team");
    });

    it("a failed poll keeps the rows on screen and raises no error", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchScanLogs.mockResolvedValueOnce(list([scanLog(), failed])).mockRejectedValueOnce(new Error("Couldn't reach the server."));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(SCAN_LOG_POLL_INTERVAL_MS);
      });

      expect(fetchScanLogs).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getAllByRole("row")).toHaveLength(3);
    });

    it("stops polling once the page is closed", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      fetchScanLogs.mockResolvedValue(list());
      const { unmount } = render(<ScanLogsView />);
      await screen.findByText("Scan history");
      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(SCAN_LOG_POLL_INTERVAL_MS * 3);
      });
      expect(fetchScanLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe("detail drawer", () => {
    const detail: ScanLogDetail = {
      summary: authFailed,
      steps: [
        { key: "start", status: "success", at: authFailed.startedAt, detail: "Started by the daily schedule" },
        { key: "find-transcripts", status: "success", at: authFailed.startedAt, detail: "118 transcript file(s) found" },
        { key: "parse-usage", status: "success", at: authFailed.startedAt, detail: "127 usage line(s) read" },
        { key: "deduplicate", status: "success", at: authFailed.startedAt, detail: "163 duplicate record(s) merged" },
        { key: "calculate-usage", status: "success", at: authFailed.startedAt, detail: "900 token(s) across 1 day(s)" },
        { key: "check-new-usage", status: "success", at: authFailed.startedAt, detail: "1 day(s) to report" },
        { key: "upload", status: "failed", at: authFailed.finishedAt, detail: "upload failed for 2026-10-07" },
        { key: "complete", status: "skipped", at: null, detail: "" },
      ],
    };

    async function openDrawerFor(log = authFailed) {
      fetchScanLogs.mockResolvedValue(list([log]));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");
      fireEvent.click(screen.getAllByRole("row")[1]!); // the whole row opens it
      return screen.getByRole("dialog");
    }

    it("explains a failed login in plain words, with copyable commands to fix it", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      // defineProperty, not assignment: a `userEvent.setup()` earlier in this
      // file installs its own clipboard as a getter-only property, which a
      // plain assignment cannot replace.
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      const drawer = await openDrawerFor();

      expect(within(drawer).getByRole("heading", { name: "Scan details" })).toBeInTheDocument();
      expect(within(drawer).getByText("Vanna")).toBeInTheDocument();
      expect(within(drawer).getByText("Authentication failed")).toBeInTheDocument();
      expect(within(drawer).getByText("Your Claude Usage login has expired or is invalid.")).toBeInTheDocument();
      expect(within(drawer).getByText("Run the login command to refresh your credentials.")).toBeInTheDocument();
      expect(within(drawer).getByText("claude-team-usage login")).toBeInTheDocument();
      expect(within(drawer).getByText("claude-team-usage scan")).toBeInTheDocument();

      fireEvent.click(within(drawer).getAllByRole("button", { name: "Copy" })[0]!);
      await waitFor(() => expect(writeText).toHaveBeenCalledWith("claude-team-usage login"));
    });

    it("keeps technical details collapsed, and fetches the timeline only when opened", async () => {
      let resolve!: (value: ScanLogDetail) => void;
      fetchScanLogDetail.mockReturnValue(new Promise((r) => (resolve = r)));
      const drawer = await openDrawerFor();

      const toggle = within(drawer).getByRole("button", { name: "Technical details" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(within(drawer).queryByText(/rejected \(401\)/)).not.toBeInTheDocument();
      expect(fetchScanLogDetail).not.toHaveBeenCalled();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(within(drawer).getByText("AUTH_FAILED (HTTP 401)")).toBeInTheDocument();
      expect(within(drawer).getByText(/rejected \(401\)/)).toBeInTheDocument();
      expect(within(drawer).getAllByText("Upload Usage / Check-in").length).toBeGreaterThan(0);
      expect(within(drawer).getByText("Loading scan steps…")).toBeInTheDocument();
      expect(fetchScanLogDetail).toHaveBeenCalledTimes(1);
      expect(fetchScanLogDetail).toHaveBeenCalledWith("log-4", "team");

      resolve(detail);
      await within(drawer).findByText("Not run.");
      const timeline = within(drawer)
        .getAllByRole("listitem")
        .filter((li) => li.querySelector("[role=img]"));
      expect(timeline).toHaveLength(8);
      expect(within(timeline[6]!).getByRole("img", { name: "Failed" })).toBeInTheDocument();
      expect(within(timeline[7]!).getByText("Not run.")).toBeInTheDocument();
    });

    it("a successful scan shows what it uploaded, with nothing to fix", async () => {
      const drawer = await openDrawerFor(scanLog());
      expect(within(drawer).getByText("Usage uploaded successfully")).toBeInTheDocument();
      expect(within(drawer).getByText(/15,240 new tokens across/)).toBeInTheDocument();
      expect(within(drawer).getByLabelText("Scan stages")).toHaveTextContent("Upload: Done");
      expect(within(drawer).queryByText("How to fix")).not.toBeInTheDocument();
    });

    it("the chevron button opens the same drawer, once", async () => {
      fetchScanLogs.mockResolvedValue(list([failed]));
      render(<ScanLogsView />);
      await screen.findByText("Scan history");
      fireEvent.click(screen.getByRole("button", { name: /View details of the scan by Dara/ }));
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(within(screen.getByRole("dialog")).getByText("Upload failed — server unreachable")).toBeInTheDocument();
    });

    it("a timeline that cannot load says so in place of the steps", async () => {
      fetchScanLogDetail.mockRejectedValue(new Error("scan log not found"));
      const drawer = await openDrawerFor();
      fireEvent.click(within(drawer).getByRole("button", { name: "Technical details" }));
      expect(await within(drawer).findByText("scan log not found")).toBeInTheDocument();
    });

    it("Escape closes it", async () => {
      await openDrawerFor();
      fireEvent.keyDown(window, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });
});

// req: FR-USAGE-002, ADR-107 — live scan status: in progress, results, notifications, member scope.
describe("ScanLogsView — live scan status (ADR-107)", () => {
  const running = scanLog({
    id: "log-run",
    status: "running",
    finishedAt: null,
    durationMs: null,
    uploadStatus: "not-attempted",
    transcriptFiles: null,
    responses: null,
    duplicates: null,
    newTokens: null,
    daysUploaded: null,
  });
  const finished = scanLog({ id: "log-run" });

  beforeEach(() => {
    fetchScanLogs.mockReset();
    fetchScanLogDetail.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Lets the fake clock run `ms`, flushing the poll it triggers. */
  async function advance(ms: number) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it("a running scan is In Progress — never success — with no completion time or duration yet", async () => {
    fetchScanLogs.mockResolvedValue(list([running]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");

    const [row] = screen.getAllByRole("row").slice(1);
    expect(within(row!).getByText("In Progress")).toBeInTheDocument();
    expect(within(row!).getByText("Not yet")).toBeInTheDocument();
    const cells = within(row!).getAllByRole("cell");
    expect(cells[4]).toHaveTextContent("—"); // duration
    expect(cells[5]).toHaveTextContent("—"); // records
    expect(within(row!).queryByText("Success")).not.toBeInTheDocument();

    const panel = screen.getByRole("region", { name: /Latest scan/ });
    expect(within(panel).getByText("Scan in progress")).toBeInTheDocument();
    expect(within(panel).getByLabelText("Scan stages")).toHaveTextContent("Scan record: Waiting");
    expect(card("Success")).toBe("0");
  });

  it("polls faster while a scan is in progress, and back to normal once it finishes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValue(list([running]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    expect(fetchScanLogs).toHaveBeenCalledTimes(1);

    await advance(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(2);

    fetchScanLogs.mockResolvedValue(list([finished]));
    await advance(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(3);

    await advance(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(3); // back to the slower pace
    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(4);
  });

  it("announces a scan that finishes while the page is open — once, and not what was there on load", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValue(list([running, failed]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    const live = screen.getByLabelText("Scan notifications");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toBeEmptyDOMElement(); // nothing on first load

    fetchScanLogs.mockResolvedValue(list([finished, failed]));
    await advance(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(within(live).getByText("Scan succeeded — Sreyly: 15,240 new tokens uploaded")).toBeInTheDocument();
    expect(within(live).getAllByRole("status")).toHaveLength(1);
    fireEvent.click(within(live).getByRole("button", { name: "Dismiss notification" }));
    expect(live).toBeEmptyDOMElement();

    // The same result on the next poll is not news: nothing comes back.
    fetchScanLogs.mockResolvedValue(list([{ ...finished }, { ...failed, receivedAt: new Date().toISOString() }]));
    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(3);
    expect(live).toBeEmptyDOMElement();
  });

  it("announces a failure in plain words, and the notification opens its details", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValue(list([scanLog()]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");

    fetchScanLogs.mockResolvedValue(list([authFailed, scanLog()]));
    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    const live = screen.getByLabelText("Scan notifications");
    expect(within(live).getByText("Scan failed — Vanna: Authentication failed")).toBeInTheDocument();
    expect(within(live).queryByText(/rejected \(401\)/)).not.toBeInTheDocument();

    fireEvent.click(within(live).getByRole("button", { name: "View details" }));
    expect(within(screen.getByRole("dialog")).getByText("Your Claude Usage login has expired or is invalid.")).toBeInTheDocument();
  });

  it("a notification dismisses itself", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValue(list([]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    fetchScanLogs.mockResolvedValue(list([scanLog()]));
    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(within(screen.getByLabelText("Scan notifications")).getAllByRole("status")).toHaveLength(1);

    fetchScanLogs.mockResolvedValue(list([scanLog()]));
    await advance(SCAN_NOTICE_DISMISS_MS);
    expect(screen.getByLabelText("Scan notifications")).toBeEmptyDOMElement();
  });

  it("the open drawer follows its scan from In Progress to its result", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValue(list([running]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    fireEvent.click(screen.getAllByRole("row")[1]!);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByRole("heading", { name: "Scan in progress" })).toBeInTheDocument();

    fetchScanLogs.mockResolvedValue(list([finished]));
    await advance(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(within(drawer).getByText("Usage uploaded successfully")).toBeInTheDocument();
    expect(within(drawer).queryByRole("heading", { name: "Scan in progress" })).not.toBeInTheDocument();
  });

  it("a start whose result never came is Failed — 'No result received' — not left In Progress", async () => {
    fetchScanLogs.mockResolvedValue(list([{ ...running, status: "incomplete" }]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    const [row] = screen.getAllByRole("row").slice(1);
    expect(within(row!).getByText("Failed")).toBeInTheDocument();
    expect(within(row!).getByText("No result received")).toBeInTheDocument();
    expect(screen.getByLabelText("Scan stages")).toHaveTextContent("Scan record: Failed");
  });

  it("scanned but couldn't upload: Partial Success, and the stages say which part failed", async () => {
    fetchScanLogs.mockResolvedValue(list([failed]));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    const stages = screen.getByLabelText("Scan stages");
    expect(stages).toHaveTextContent("Scan: Done");
    expect(stages).toHaveTextContent("Upload: Failed");
    expect(stages).toHaveTextContent("Scan record: Done");
    expect(screen.getByRole("region", { name: /Latest scan/ })).toHaveTextContent("Partial Success");
  });

  it("no scan in the range: No Recent Scan, and the empty state", async () => {
    fetchScanLogs.mockResolvedValue(list([]));
    render(<ScanLogsView />);
    await screen.findByText("No scan logs yet");
    const panel = screen.getByRole("region", { name: /Latest scan/ });
    expect(within(panel).getByText("No Recent Scan")).toBeInTheDocument();
    expect(within(panel).queryByLabelText("Scan stages")).not.toBeInTheDocument();
  });

  it("shows when it last heard from the server, and a failed refresh backs off instead of hammering", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchScanLogs.mockResolvedValueOnce(list([scanLog()])).mockRejectedValue(new Error("Couldn't reach the server."));
    render(<ScanLogsView />);
    await screen.findByText("Scan history");
    expect(screen.getByText(/Last updated: \d/)).toBeInTheDocument();

    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Couldn.t refresh — retrying/)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2); // the rows stay

    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(2); // waiting twice as long now
    await advance(SCAN_LOG_POLL_INTERVAL_MS);
    expect(fetchScanLogs).toHaveBeenCalledTimes(3);
  });

  describe("a member's own scans (scope mine)", () => {
    it("reads the self-service endpoint, with no User column, filter or Dashboard tab", async () => {
      fetchScanLogs.mockResolvedValue(list([scanLog()]));
      render(<ScanLogsView scope="mine" />);
      await screen.findByText("Scan history");

      expect(screen.getByRole("heading", { name: "My Scan Logs" })).toBeInTheDocument();
      expect(fetchScanLogs.mock.calls[0]![2]).toBe("mine");
      expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).not.toContain("User");
      expect(screen.queryByLabelText("User")).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Scan Logs" })).toBeInTheDocument();
    });

    it("the drawer's timeline comes from the same endpoint, and fixes are for 'your PC'", async () => {
      fetchScanLogs.mockResolvedValue(list([authFailed]));
      fetchScanLogDetail.mockResolvedValue({ summary: authFailed, steps: [] });
      render(<ScanLogsView scope="mine" />);
      await screen.findByText("Scan history");
      fireEvent.click(screen.getAllByRole("row")[1]!);
      const drawer = screen.getByRole("dialog");
      expect(within(drawer).getByText("Commands run in a terminal on your PC.")).toBeInTheDocument();
      fireEvent.click(within(drawer).getByRole("button", { name: "Technical details" }));
      await waitFor(() => expect(fetchScanLogDetail).toHaveBeenCalledWith("log-4", "mine"));
    });

    it("an empty history says what to do on their own PC", async () => {
      fetchScanLogs.mockResolvedValue(list([]));
      render(<ScanLogsView scope="mine" />);
      expect(await screen.findByText(/once claude-team-usage runs on your PC/)).toBeInTheDocument();
    });
  });
});
