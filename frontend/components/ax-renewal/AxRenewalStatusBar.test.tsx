import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

const { useAxRenewalProjectContext } = vi.hoisted(() => ({ useAxRenewalProjectContext: vi.fn() }));
vi.mock("@/lib/ax-renewal/AxRenewalProjectContext", () => ({ useAxRenewalProjectContext }));

const { fetchEngineStatus } = vi.hoisted(() => ({ fetchEngineStatus: vi.fn() }));
vi.mock("@/lib/ax-renewal/api", () => ({ fetchEngineStatus }));

import { AxRenewalStatusBar } from "./AxRenewalStatusBar";
import type { AxRenewalProjectDetail } from "@/lib/ax-renewal/api";

function detailFixture(): AxRenewalProjectDetail {
  return {
    project: {
      id: "p1",
      name: "Legacy Portal",
      description: null,
      status: "draft",
      manifestFilename: null,
      manifestAttachedAt: null,
      attachStats: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      revision: 0,
      member: true,
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
    members: [],
  };
}

describe("AxRenewalStatusBar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("says so plainly when no project is selected, without ever claiming a model status", () => {
    useSession.mockReturnValue({ user: { displayName: "Ek Sarayuth", role: "super_admin" } });
    useAxRenewalProjectContext.mockReturnValue({ detail: null });
    fetchEngineStatus.mockResolvedValue({ connected: false, readsSource: false });

    render(<AxRenewalStatusBar />);

    expect(screen.getByText("No project selected")).toBeInTheDocument();
  });

  it("says 'checking model' until the engine status resolves, not a guess either way", () => {
    useSession.mockReturnValue({ user: { displayName: "Ek Sarayuth", role: "super_admin" } });
    useAxRenewalProjectContext.mockReturnValue({ detail: detailFixture() });
    fetchEngineStatus.mockReturnValue(new Promise(() => {})); // never resolves in this test

    render(<AxRenewalStatusBar />);

    expect(screen.getByText("checking model")).toBeInTheDocument();
    expect(screen.queryByText("no model")).not.toBeInTheDocument();
    expect(screen.queryByText("local model")).not.toBeInTheDocument();
  });

  it("says 'no model' on a deployment with none configured", async () => {
    useSession.mockReturnValue({ user: { displayName: "Ek Sarayuth", role: "super_admin" } });
    useAxRenewalProjectContext.mockReturnValue({ detail: detailFixture() });
    fetchEngineStatus.mockResolvedValue({ connected: false, readsSource: false });

    render(<AxRenewalStatusBar />);

    expect(await screen.findByText("no model")).toBeInTheDocument();
  });

  it("says 'local model' once a local Claude Code installation actually answers — this is the regression this guards", async () => {
    useSession.mockReturnValue({ user: { displayName: "Ek Sarayuth", role: "super_admin" } });
    useAxRenewalProjectContext.mockReturnValue({ detail: detailFixture() });
    fetchEngineStatus.mockResolvedValue({ connected: true, readsSource: false });

    render(<AxRenewalStatusBar />);

    const label = await screen.findByText("local model");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("text-foreground");
    expect(screen.queryByText("no model")).not.toBeInTheDocument();
  });
});
