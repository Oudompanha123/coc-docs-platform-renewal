"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/layout/icons";
import type { NavProduct } from "@/lib/docs/nav-api";
import { hrefFor } from "@/lib/docs/nav-routing";

/**
 * Trigger + dropdown panel, single-select, checkmark on the active header —
 * the "click outside to close" behavior matches Topbar.tsx's existing
 * notification/mail dropdowns (ref + mousedown listener), reused here
 * instead of inventing a new interaction pattern.
 */
export function DocsHeaderSwitcher({ active, products }: { active: NavProduct; products: NavProduct[] }) {
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

  function selectProduct(product: NavProduct) {
    setOpen(false);
    router.push(hrefFor(product.key, product.items[0]?.slug ?? ""));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-9 w-full items-center justify-between rounded-control border border-surface-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        {active.label}
        <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-surface-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {products.map((product) => {
            const isActive = product.key === active.key;
            return (
              <button
                key={product.key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectProduct(product)}
                className={`flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-sm transition-colors ${
                  isActive ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-accent"
                }`}
              >
                {product.label}
                {isActive && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
