"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AxRenewalNotFoundError,
  fetchProjectDetail,
  listProjects,
  type AxRenewalProject,
  type AxRenewalProjectDetail,
} from "./api";

/**
 * What to say when a project will not load because it is not there *for
 * this caller* — which, by design (ADR-064), cannot be told apart from it
 * not being there at all. Says both, and the way in.
 */
export const PROJECT_NOT_AVAILABLE =
  "This project doesn't exist, or you're not a member of it. Ask one of its members to add you under Workspace → Members.";

/**
 * The current AX Renewal project and its detail, driven by the `project`
 * query param — the single source of truth shared between the sidebar's
 * nested Explorer tree (Sidebar.tsx) and the page's content, which are
 * siblings in the component tree and so cannot share plain React state.
 * Each calls this independently; both land on the same project because both
 * read the same URL.
 */
export function useAxRenewalProject(enabled: boolean = true) {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("project");

  const [projects, setProjects] = useState<AxRenewalProject[] | null>(null);
  const [detail, setDetail] = useState<AxRenewalProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Gated so the sidebar — which calls this on every route to know whether
  // to render the nested tree at all — does not fetch AX Renewal data on
  // pages that have nothing to do with it.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    listProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load AX Renewal projects.");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const effectiveProjectId = enabled ? projectIdParam ?? projects?.[0]?.id ?? null : null;

  const refresh = useCallback(async () => {
    if (!effectiveProjectId) return;
    try {
      setDetail(await fetchProjectDetail(effectiveProjectId));
      setError(null);
    } catch (err) {
      // Drop whatever was on screen before: a failed load must never leave
      // the *previous* project's plan showing under this one's URL — least
      // of all when the failure is "you may not see this one" (ADR-064).
      setDetail(null);
      if (err instanceof AxRenewalNotFoundError) setError(PROJECT_NOT_AVAILABLE);
      else setError(err instanceof Error ? err.message : "Couldn't load this project.");
    }
  }, [effectiveProjectId]);

  useEffect(() => {
    if (effectiveProjectId) void refresh();
    else setDetail(null);
  }, [effectiveProjectId, refresh]);

  return { projects, projectId: effectiveProjectId, detail, error, refresh, setProjects };
}
