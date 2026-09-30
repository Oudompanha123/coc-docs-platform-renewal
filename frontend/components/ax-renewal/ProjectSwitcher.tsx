"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";
import type { AxRenewalProject } from "@/lib/ax-renewal/api";

/**
 * Trigger + dropdown panel, single-select, checkmark on the active project —
 * same interaction pattern as DocsHeaderSwitcher (ref + mousedown listener
 * for click-outside, role="listbox"/"option"), reused here instead of the
 * browser's own default <select> rendering, which couldn't carry this app's
 * card/button styling (rounded-[10px], brand-purple accents).
 *
 * Mine / All (ADR-063, ADR-064): the backend only ever lists projects the
 * caller may access — for everyone but a super admin, exactly the ones they
 * are a member of — so for them Mine and All would be the same list, and the
 * toggle is not shown at all. It appears only when the list holds projects
 * the caller is *not* on, which means a super admin, who is served every
 * project. There it opens on Mine if they are on any project, else All, and
 * the trigger always names the open project even when the filter hides it.
 * Filtering here is presentation only — it never decides what may be seen.
 */
export function ProjectSwitcher({
  projects,
  projectId,
  onSelect,
}: {
  projects: AxRenewalProject[] | null;
  projectId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // null until someone picks — until then the default follows the data,
  // which may still be loading on first render.
  const [chosenScope, setChosenScope] = useState<"mine" | "all" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const list = projects ?? [];
  const active = list.find((p) => p.id === projectId) ?? null;
  const hasMine = list.some((p) => p.member);
  const hasOthers = list.some((p) => !p.member);
  const scope = hasOthers ? chosenScope ?? (hasMine ? "mine" : "all") : "all";
  const shown = scope === "mine" ? list.filter((p) => p.member) : list;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function selectProject(id: string) {
    setOpen(false);
    onSelect(id);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id="ax-project"
        type="button"
        disabled={list.length === 0}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-w-[220px] items-center justify-between gap-2 rounded-[10px] border border-border bg-white px-3 py-1.5 text-sm font-medium text-dash-ink transition-colors hover:bg-page focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
      >
        <span className="truncate">{active?.name ?? "No projects yet"}</span>
        {list.length > 0 && (
          <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && list.length > 0 && (
        <div
          role="listbox"
          aria-labelledby="ax-project"
          className="absolute left-0 top-full z-10 mt-1 max-h-72 min-w-[220px] overflow-y-auto rounded-[10px] border border-border bg-white py-1 shadow-lg"
        >
          {hasOthers && (
            <div role="group" aria-label="Which projects to list" className="flex gap-1 border-b border-border px-2 pb-1.5 pt-0.5">
              {(["mine", "all"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => setChosenScope(value)}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${
                    scope === value ? "bg-brand-purple/10 text-brand-purple" : "text-muted hover:bg-page"
                  }`}
                >
                  {value === "mine" ? "Mine" : "All"}
                </button>
              ))}
            </div>
          )}
          {shown.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">You&rsquo;re not a member of any project yet.</p>
          )}
          {shown.map((p) => {
            const isActive = p.id === projectId;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectProject(p.id)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  isActive ? "bg-brand-purple/10 font-semibold text-brand-purple" : "text-dash-ink hover:bg-page"
                }`}
              >
                <span className="truncate">{p.name}</span>
                {isActive && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
