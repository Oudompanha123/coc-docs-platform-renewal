"use client";

import { useEffect, useRef, useState } from "react";
import { LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import type { NavProduct } from "@/lib/docs/nav-api";

export function NavDropdown({
  product,
  isDark,
  onRequireAuth,
}: {
  product: NavProduct;
  isDark: boolean;
  onRequireAuth: (productLabel: string) => void;
}) {
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
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => onRequireAuth(product.label)}
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
            <button
              key={item.slug || "index"}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onRequireAuth(product.label); }}
              className={`block w-full truncate px-4 py-2 text-left text-sm transition-colors ${
                isDark ? "text-[#a79fc9] hover:bg-white/10 hover:text-[#f2effa]" : "text-muted hover:bg-page hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
