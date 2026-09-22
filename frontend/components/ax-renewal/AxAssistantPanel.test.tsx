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
}));

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
});
