"use client";

/**
 * NavMenu — the header's dropdown, in the coc-docs design system's
 * navigation-menu shape (ADR-104 r2.9).
 *
 * Trigger: a quiet label that becomes a soft grey pill while its panel is open
 * (the skill's `navigation-menu-trigger`: `rounded-3xl px-2.5 py-2 text-sm`,
 * `bg-muted/50` open). Panel: a large rounded card holding a grid of items,
 * each a title over a one-line description — no icon tiles, no uppercase
 * section label.
 *
 * It opens on hover, as a site navigation menu does, and also on click and
 * keyboard, so it works without a pointer. The two have to be reconciled: a
 * real click begins with the pointer entering the trigger, which already
 * opened the menu by hover, so a plain toggle on click would shut it again
 * the instant it appeared. `openedBy` tracks how it opened — a click on a
 * hover-opened menu *pins* it rather than closing it, and only a click on a
 * pinned menu closes. A pinned menu ignores the pointer leaving. Escape and a
 * click outside always close.
 *
 * Kept on `role="menu"`/`menuitem` with a real `<button>` trigger rather than
 * Radix's NavigationMenu, whose list/link semantics would have rewritten the
 * tests these headers already have for no visible gain.
 *
 * // req: ADR-104
 */
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 150;

const NavMenuContext = createContext<{ close: () => void }>({ close: () => {} });

export function NavMenu({
  label,
  active = false,
  align = "start",
  panelClassName,
  children,
}: {
  label: ReactNode;
  /** The current page lives under this menu — the label reads as current. */
  active?: boolean;
  /** `end` lines the panel up with the trigger's right edge, for a menu near the right of the page. */
  align?: "start" | "center" | "end";
  /** Width and grid of the panel's item area, e.g. `w-[440px] grid-cols-2`. */
  panelClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openedBy = useRef<"hover" | "click" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable identities: both are read inside effects below.
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const close = useCallback(() => {
    clearCloseTimer();
    openedBy.current = null;
    setOpen(false);
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open, close]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        if (!open) {
          openedBy.current = "hover";
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (openedBy.current !== "hover") return;
        clearCloseTimer();
        closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            openedBy.current = "click";
            setOpen(true);
          } else if (openedBy.current === "hover") {
            openedBy.current = "click";
          } else {
            close();
          }
        }}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-3xl px-3.5 text-[15px] transition-colors outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50",
          open
            ? "bg-muted-surface text-foreground"
            : active
              ? "text-foreground hover:bg-muted-surface/60"
              : "text-muted-foreground hover:bg-muted-surface/60 hover:text-foreground",
        )}
      >
        {label}
        <ChevronDownIcon className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        // `pt-2` rather than a margin: the gap between trigger and panel is
        // part of this element, so the pointer crossing it never "leaves".
        <div
          className={cn(
            "absolute top-full z-50 pt-2",
            align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-0" : "left-0",
          )}
        >
          <div
            role="menu"
            className={cn(
              "animate-tab-content grid gap-1 rounded-3xl border border-surface-border bg-popover p-3 text-popover-foreground shadow-lg",
              panelClassName,
            )}
          >
            <NavMenuContext.Provider value={{ close }}>{children}</NavMenuContext.Provider>
          </div>
        </div>
      )}
    </div>
  );
}

const itemClass =
  "group flex flex-col gap-1 rounded-2xl p-3 text-left transition-colors outline-none hover:bg-muted-surface focus-visible:bg-muted-surface";

/** One entry: a title over a short muted description. A link with `href`, a button with `onSelect`. */
export function NavMenuItem({
  title,
  description,
  href,
  onSelect,
  active = false,
  trailing,
}: {
  title: ReactNode;
  description?: ReactNode;
  href?: string;
  onSelect?: () => void;
  active?: boolean;
  /** A small marker after the title, e.g. a lock on a signed-out preview. */
  trailing?: ReactNode;
}) {
  const { close } = useContext(NavMenuContext);
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className="truncate">{title}</span>
        {trailing}
      </span>
      {description && <span className="line-clamp-2 text-sm leading-snug text-muted-foreground">{description}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          close();
          onSelect?.();
        }}
        className={cn(itemClass, active && "bg-muted-surface")}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onSelect?.();
      }}
      className={cn(itemClass, active && "bg-muted-surface")}
    >
      {body}
    </button>
  );
}

/** "Overview, Installation, API…" — a product's first pages, as its description in a menu. */
export function productPagesBlurb(items: { label: string }[], max = 3): string | undefined {
  if (items.length === 0) return undefined;
  const shown = items.slice(0, max).map((i) => i.label).join(", ");
  return items.length > max ? `${shown}…` : shown;
}
