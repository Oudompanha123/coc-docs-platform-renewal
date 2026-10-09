"use client";

import { useEffect, useRef, useState } from "react";
import { LockIcon } from "@/components/auth/icons";
import { ChevronDownIcon, LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import type { NavProduct } from "@/lib/docs/nav-api";

/**
 * A single "Products ▾" trigger opening one grid of every product — not one
 * dropdown per product (that was `NavDropdown`'s old shape, replaced here to
 * match the authenticated header's own `ProductsDropdown` layout exactly, on
 * direct request). Each tile is a locked preview, same as `ReportsNavDropdown`'s
 * item: a click closes the menu and calls `onRequireAuth` rather than
 * navigating anywhere — nothing here is a real link.
 */
export function ProductsNavDropdown({
  products,
  isDark,
  onRequireAuth,
}: {
  products: NavProduct[];
  isDark: boolean;
  onRequireAuth: (productLabel: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-14 items-center gap-1.5 border-b-2 transition-colors ${
          open ? "border-primary font-bold" : "border-transparent hover:border-primary"
        } ${isDark ? "hover:text-[#fafafa]" : "hover:text-ink"}`}
      >
        Products
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute left-0 top-14 z-30 w-[22rem] rounded-2xl border p-4 shadow-xl ${
            isDark ? "border-[#2a2a2a] bg-[#171717]" : "border-border bg-white"
          }`}
        >
          <p
            className={`mb-3 text-[11px] font-semibold uppercase tracking-widest ${
              isDark ? "text-[#737373]" : "text-muted"
            }`}
          >
            PRODUCTS
          </p>
          <div className="grid grid-cols-2 gap-2">
            {products.map((product) => {
              const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
              return (
                <button
                  key={product.key}
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpen(false); onRequireAuth(product.label); }}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    isDark ? "hover:bg-white/10" : "hover:bg-secondary"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isDark ? "bg-primary/15 text-[#fafafa]" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`flex min-w-0 flex-1 items-center justify-between gap-2 truncate text-[15px] font-medium ${
                      isDark ? "text-[#fafafa]" : "text-ink"
                    }`}
                  >
                    <span className="truncate">{product.label}</span>
                    <LockIcon
                      className={`h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                        isDark ? "text-[#a1a1a1]" : "text-muted"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
