"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/layout/icons";
import { DOCS_HEADERS, hrefFor, type DocsHeaderNav } from "@/lib/docs/jexmcp-nav";

/**
 * Trigger + dropdown panel, single-select, checkmark on the active header —
 * the "click outside to close" behavior matches Topbar.tsx's existing
 * notification/mail dropdowns (ref + mousedown listener), reused here
 * instead of inventing a new interaction pattern.
 */
export function DocsHeaderSwitcher({ active }: { active: DocsHeaderNav }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function selectHeader(header: DocsHeaderNav) {
    setOpen(false);
    router.push(hrefFor(header.key, header.items[0]?.slug ?? ""));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-lg border border-border bg-page px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-white"
      >
        {active.label}
        <ChevronDownIcon className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {DOCS_HEADERS.map((header) => {
            const isActive = header.key === active.key;
            return (
              <button
                key={header.key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectHeader(header)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-brand-purple/10 font-semibold text-brand-purple" : "text-ink hover:bg-page"
                }`}
              >
                {header.label}
                {isActive && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
