import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { searchParams } = vi.hoisted(() => ({ searchParams: { current: new URLSearchParams() } }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams.current,
}));

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return { ...actual, listProjects: vi.fn(), fetchProjectDetail: vi.fn() };
});

import { AxRenewalNotFoundError, fetchProjectDetail, listProjects, type AxRenewalProjectDetail } from "./api";
import { PROJECT_NOT_AVAILABLE, useAxRenewalProject } from "./useAxRenewalProject";

/**
 * A project the caller may not see comes back as a 404 (ADR-070). The
 * workspace must then show nothing of it — and nothing of the project that
 * was open before, either.
 */
describe("useAxRenewalProject — a project the caller may not access", () => {
  function detail(id: string): AxRenewalProjectDetail {
    return {
      project: {
        id,
        name: `Project ${id}`,
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listProjects).mockResolvedValue([detail("mine").project]);
  });

  it("shows no detail and says why, without claiming which of the two reasons it is", async () => {
    searchParams.current = new URLSearchParams("project=not-mine");
    vi.mocked(fetchProjectDetail).mockRejectedValue(new AxRenewalNotFoundError("project not found"));

    const { result } = renderHook(() => useAxRenewalProject());

    await waitFor(() => expect(result.current.error).toBe(PROJECT_NOT_AVAILABLE));
    expect(result.current.detail).toBeNull();
  });

  it("drops the previously open project's detail when the next one is refused", async () => {
    searchParams.current = new URLSearchParams("project=mine");
    vi.mocked(fetchProjectDetail).mockResolvedValueOnce(detail("mine"));
    const { result, rerender } = renderHook(() => useAxRenewalProject());
    await waitFor(() => expect(result.current.detail?.project.id).toBe("mine"));

    // Navigating by URL to a project the caller was never added to.
    searchParams.current = new URLSearchParams("project=not-mine");
    vi.mocked(fetchProjectDetail).mockRejectedValueOnce(new AxRenewalNotFoundError("project not found"));
    rerender();

    await waitFor(() => expect(result.current.error).toBe(PROJECT_NOT_AVAILABLE));
    expect(result.current.detail).toBeNull();
  });

  it("keeps an ordinary failure's own message", async () => {
    searchParams.current = new URLSearchParams("project=mine");
    vi.mocked(fetchProjectDetail).mockRejectedValue(new Error("Couldn't reach the server."));

    const { result } = renderHook(() => useAxRenewalProject());

    await waitFor(() => expect(result.current.error).toBe("Couldn't reach the server."));
    expect(result.current.detail).toBeNull();
  });
});
