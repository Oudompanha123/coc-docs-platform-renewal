import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

const { useAxRenewalProjectContext } = vi.hoisted(() => ({ useAxRenewalProjectContext: vi.fn() }));
vi.mock("@/lib/ax-renewal/AxRenewalProjectContext", () => ({ useAxRenewalProjectContext }));

vi.mock("@/lib/ax-renewal/api", () => ({
  addComment: vi.fn(),
  confirmSection: vi.fn(),
  reopenSection: vi.fn(),
  runAnalysis: vi.fn(),
  startImplementation: vi.fn(),
  // Added with the engine banner (ADR-043): the panel asks on mount whether
  // a model is connected. Resolving "not connected" keeps these tests on the
  // branch they were written for -- the banner they assert nothing about.
  fetchEngineStatus: vi.fn().mockResolvedValue({ connected: false, readsSource: false }),
}));

import { fetchEngineStatus } from "@/lib/ax-renewal/api";
import { AxAssistantPanel } from "./AxAssistantPanel";
import type { AxRenewalProjectDetail } from "@/lib/ax-renewal/api";

/** Set by each test before rendering — read by the next/navigation mock above. */
let searchParamsString = "";

function detailFixture(): AxRenewalProjectDetail {
  return {
    project: {
      id: "p1",
      name: "Sample Project",
      description: null,
      status: "draft",
      manifestFilename: null,
      manifestAttachedAt: null,
      attachStats: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    analysis: null,
    stackLayers: [],
    architecture: null,
    pageMappings: [],
    dbChanges: [],
    dbConnection: null,
    destination: null,
    confirmations: {},
    latestImplementationRun: null,
    comments: [],
  };
}

describe("AxAssistantPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders 'no tab open' instead of crashing once every tab has been closed (section=none)", () => {
    // Reproduces the reported bug exactly: closing the last open tab
    // navigates to the shared NO_TAB_OPEN sentinel ("none"), and this panel
    // used to resolve `active` with its own `?? "attach"` fallback instead
    // of going through resolveActiveSection — so EXPLORER_META["none"] came
    // back undefined and reading `.group` off it threw.
    searchParamsString = "project=p1&section=none";
    useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
    useAxRenewalProjectContext.mockReturnValue({
      projectId: "p1",
      detail: detailFixture(),
      refresh: vi.fn(),
    });

    expect(() => render(<AxAssistantPanel />)).not.toThrow();
    expect(screen.getByText("no tab open")).toBeInTheDocument();
  });

  it("still renders its normal 'reading/acting on' header for a real open tab", () => {
    searchParamsString = "project=p1&section=attach";
    useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
    useAxRenewalProjectContext.mockReturnValue({
      projectId: "p1",
      detail: detailFixture(),
      refresh: vi.fn(),
    });

    render(<AxAssistantPanel />);
    expect(screen.getByText("understand / attach source")).toBeInTheDocument();
  });

  // The banner is the one line in this panel whose job is to be honest about
  // what the assistant can do, so each state gets pinned. It used to assert
  // "No model connected" unconditionally — true of every deployment, wrong on
  // a machine with a local Claude Code installation (ADR-043).
  describe("engine banner", () => {
    function renderWithEngine(engine: { connected: boolean; readsSource: boolean }) {
      vi.mocked(fetchEngineStatus).mockResolvedValue(engine);
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });
      render(<AxAssistantPanel />);
    }

    it("offers 'connect' when no model answers", async () => {
      renderWithEngine({ connected: false, readsSource: false });

      expect(await screen.findByText(/No model connected/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "connect" })).toBeInTheDocument();
    });

    it("says the source is read when the local model can see it", async () => {
      renderWithEngine({ connected: true, readsSource: true });

      expect(await screen.findByText(/Local model in use/)).toBeInTheDocument();
      expect(screen.getByText("reads your source")).toBeInTheDocument();
      // Nothing left to connect, so the button that offers it must be gone.
      expect(screen.queryByRole("button", { name: "connect" })).not.toBeInTheDocument();
    });

    it("does not claim the source was read when only the manifest was", async () => {
      // The distinction that matters: a connected model which has seen one
      // dependency file must never read as one that reviewed the codebase.
      renderWithEngine({ connected: true, readsSource: false });

      expect(await screen.findByText("reads the manifest only")).toBeInTheDocument();
      expect(screen.queryByText("reads your source")).not.toBeInTheDocument();
    });

    it("says nothing at all until the answer is known", () => {
      // A flash of "no model connected" that corrects itself would teach
      // people to distrust the line that exists to be trusted.
      vi.mocked(fetchEngineStatus).mockReturnValue(new Promise(() => {}));
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });

      render(<AxAssistantPanel />);

      expect(screen.queryByText(/No model connected/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Local model in use/)).not.toBeInTheDocument();
    });
  });

  // "Stop using" is deliberately not "disconnect". The path in .env.local is
  // untouched and the backend could still spawn the CLI — all this does is
  // stop asking for it, which is the only thing a web page honestly can do
  // about configuration it cannot edit (ADR-043).
  describe("stop using / use it", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    function renderConnected() {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: true });
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });
      render(<AxAssistantPanel />);
    }

    it("offers to stop using a model that is in use", async () => {
      renderConnected();

      expect(await screen.findByRole("button", { name: "stop using" })).toBeInTheDocument();
    });

    it("switches to the keyword analysis, and says the model is still there", async () => {
      renderConnected();

      (await screen.findByRole("button", { name: "stop using" })).click();

      // Not "disconnected": nothing was disconnected from anything.
      expect(await screen.findByText(/A model is available/)).toBeInTheDocument();
      expect(screen.getByText("not using it here")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "use it" })).toBeInTheDocument();
    });

    it("remembers the choice for the next visit", async () => {
      renderConnected();

      (await screen.findByRole("button", { name: "stop using" })).click();
      await screen.findByText(/A model is available/);

      expect(localStorage.getItem("coc-ax-renewal-use-model")).toBe("false");
    });

    it("turns it back on, leaving nothing behind in storage", async () => {
      localStorage.setItem("coc-ax-renewal-use-model", "false");
      renderConnected();

      (await screen.findByRole("button", { name: "use it" })).click();

      expect(await screen.findByText(/Local model in use/)).toBeInTheDocument();
      // Removed rather than set to "true": the default is to use it, and a
      // stored "true" would be a second way of saying the same thing.
      expect(localStorage.getItem("coc-ax-renewal-use-model")).toBeNull();
    });

    it("offers neither button when there is no model to use", async () => {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: false, readsSource: false });
      searchParamsString = "project=p1&section=attach";
      useSession.mockReturnValue({ user: { role: "admin", roles: ["developer"] } });
      useAxRenewalProjectContext.mockReturnValue({
        projectId: "p1",
        detail: detailFixture(),
        refresh: vi.fn(),
      });

      render(<AxAssistantPanel />);

      expect(await screen.findByRole("button", { name: "connect" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "stop using" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "use it" })).not.toBeInTheDocument();
    });
  });
});
