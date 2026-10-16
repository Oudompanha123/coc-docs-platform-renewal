"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LockIcon } from "@/components/auth/icons";
import { MoonIcon, SunIcon } from "@/components/layout/icons";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { NavMenu, NavMenuItem, productPagesBlurb } from "@/components/ui/nav-menu";
import { ProductsNavDropdown } from "@/components/welcome/ProductsNavDropdown";
import { ThemedLogo } from "@/components/welcome/ThemedLogo";
import { FALLBACK_NAV } from "@/lib/docs/nav-api";

const LINK_CLASS =
  "inline-flex h-9 items-center rounded-3xl px-3.5 transition-colors outline-none hover:bg-muted-surface/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * The signed-out navbar — one component for `/welcome` and the public Store,
 * so the two read as one site: the logo back to /welcome, Home, Store and
 * Products (a locked preview: choosing a product asks the visitor to sign
 * in), then the language menu, the theme toggle, Log in and Start free.
 * Below md the links collapse into one "Menu" so a narrow window keeps them.
 *
 * No shadow: the border appearing once the page scrolls is the whole signal
 * that the bar has detached from the content.
 *
 * Theme is the caller's: /welcome keeps its own local toggle, the Store uses
 * the shared preference. This only shows it and reports the click.
 */
export function PublicHeader({
  active,
  homeHref = "/welcome",
  isDark,
  onToggleTheme,
  onRequireAuth,
  surfaceClassName = "bg-background",
}: {
  /** The page the visitor is on — that link reads as current. */
  active: "home" | "store";
  homeHref?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onRequireAuth: (product: string) => void;
  /** The bar's background — the page's own surface, so the bar never reads as a band of a different shade. */
  surfaceClassName?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b ${surfaceClassName} transition-colors duration-200 ${
        scrolled ? "border-surface-border" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/welcome" className="flex items-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ThemedLogo className="h-8 w-auto rounded-md" />
          </Link>
          <div className="md:hidden">
            <NavMenu label="Menu" panelClassName="w-[280px] grid-cols-1">
              <NavMenuItem title="Home" href={homeHref} active={active === "home"} />
              <NavMenuItem title="Store" href="/store" active={active === "store"} />
              {FALLBACK_NAV.map((product) => (
                <NavMenuItem
                  key={product.key}
                  title={product.label}
                  description={productPagesBlurb(product.items) ?? "Documentation"}
                  onSelect={() => onRequireAuth(product.label)}
                  trailing={<LockIcon className="size-3 shrink-0 text-muted-foreground" />}
                />
              ))}
            </NavMenu>
          </div>
        </div>

        <nav className="ml-8 mr-auto hidden items-center gap-1 text-[15px] text-muted-foreground md:flex">
          <Link
            href={homeHref}
            aria-current={active === "home" ? "page" : undefined}
            className={`${LINK_CLASS} ${active === "home" ? "text-foreground" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/store"
            aria-current={active === "store" ? "page" : undefined}
            className={`${LINK_CLASS} ${active === "store" ? "text-foreground" : ""}`}
          >
            Store
          </Link>
          <ProductsNavDropdown products={FALLBACK_NAV} onRequireAuth={onRequireAuth} />
        </nav>

        <div className="flex items-center gap-2">
          {/* Signed out, so no Settings page yet — the navbar carries the
              language choice (ADR-116). */}
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            {/* Both icons, CSS picks one — right before JavaScript has read the theme. */}
            <SunIcon className="hidden h-4 w-4 dark:block" />
            <MoonIcon className="h-4 w-4 dark:hidden" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
