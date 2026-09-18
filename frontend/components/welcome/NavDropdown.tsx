"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import type { NavProduct } from "@/lib/docs/nav-api";

/**
 * One top-nav product link with a dropdown of its full real sub-item list
 * (`FALLBACK_NAV`, same source `DashboardPreview.tsx` reads — no second
 * hardcoded copy). Opens on hover or click, closes on outside click or
 * Escape, and is `absolute`-positioned so opening it never shifts the nav
 * bar or the content below it.
 */
export function NavDropdown({ product, isDark }: { product: NavProduct; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;

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
    <div ref={containerRef} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-[72px] items-center gap-1.5 border-b-2 transition-all hover:font-bold ${
          open ? "border-brand-purple font-bold" : "border-transparent hover:border-brand-purple"
        } ${isDark ? "hover:text-[#f2effa]" : "hover:text-ink"}`}
      >
        <Icon className="h-4 w-4" />
        {product.label}
      </button>

      {open && product.items.length > 0 && (
        <div
          role="menu"
          className={`absolute left-0 top-[72px] z-30 w-56 rounded-[10px] border py-2 shadow-lg ${
            isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
          }`}
        >
          {product.items.map((item) => (
            <Link
              key={item.slug || "index"}
              href="/login"
              role="menuitem"
              className={`block truncate px-4 py-2 text-sm transition-colors ${
                isDark ? "text-[#a79fc9] hover:bg-white/10 hover:text-[#f2effa]" : "text-muted hover:bg-page hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
