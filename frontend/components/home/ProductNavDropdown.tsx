"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import type { NavProduct } from "@/lib/docs/nav-api";
import { productHref, productItemHref } from "@/lib/home/product-links";

/**
 * One top-nav product link on the Member header, with a hover dropdown of
 * its real sub-items — same open/close interaction as `/welcome`'s
 * `NavDropdown`, but linking to each item's actual `/docs/...` page instead
 * of `/login`, since this reader is already signed in. Built as its own
 * component rather than reusing `NavDropdown` directly, per this page's
 * "independent file" decision.
 */
export function ProductNavDropdown({ product }: { product: NavProduct }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const href = productHref(product.key);
  const active = pathname === href || pathname?.startsWith(`${href}/`);
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
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        onClick={() => setOpen(false)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-[72px] items-center gap-1.5 border-b-2 transition-all hover:border-brand-purple hover:font-bold hover:text-ink ${
          active ? "border-brand-purple font-bold text-ink" : "border-transparent"
        }`}
      >
        <Icon className="h-4 w-4" />
        {product.label}
      </Link>

      {open && product.items.length > 0 && (
        <div
          role="menu"
          className="absolute left-0 top-[72px] z-30 w-56 rounded-[10px] border border-border bg-white py-2 shadow-lg"
        >
          {product.items.map((item) => (
            <Link
              key={item.slug || "index"}
              href={productItemHref(product.key, item.slug)}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block truncate px-4 py-2 text-sm text-muted transition-colors hover:bg-page hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
