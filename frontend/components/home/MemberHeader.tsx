"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  BellIcon,
  ChevronDownIcon,
  GlobeIcon,
  LayersIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  PersonIcon,
  ReturnIcon,
  SettingsIcon,
  SunIcon,
} from "@/components/layout/icons";
import { LANGUAGE_LABELS, type Language } from "@/lib/i18n/translations";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { Spinner } from "@/components/layout/Spinner";
import { actorInitials, actorName, timeAgo } from "@/lib/notify/activity";
import { useActivityFeed } from "@/lib/notify/useActivityFeed";
import { useNotifications } from "@/lib/notify/useNotifications";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { productHref } from "@/lib/home/product-links";
import type { NavProduct } from "@/lib/docs/nav-api";

type MenuKey = "bell" | "mail" | "user" | "products" | "lang";

const PANEL_CLASSES = "absolute right-0 z-30 mt-2 w-80 rounded-xl border border-border bg-white shadow-lg";

function CountIcon({
  count,
  label,
  active,
  onClick,
  children,
}: {
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${count}`}
      aria-haspopup="menu"
      aria-expanded={active}
      className="relative rounded-xl bg-gray-100 p-2.5 text-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/** Products mega-dropdown — 2-col grid with large lavender icon tiles. */
function ProductsDropdown({
  products,
  onClose,
}: {
  products: NavProduct[];
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div
      role="menu"
      className="absolute left-0 top-[72px] z-30 w-80 rounded-2xl border border-border bg-white p-4 shadow-xl"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
        {t.products.label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => {
          const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
          const href = productHref(product.key);
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={product.key}
              href={href}
              role="menuitem"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-brand-purple/10 ${
                active ? "bg-brand-purple/10" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-purple ${
                  active ? "bg-brand-purple/20" : "bg-brand-purple/10"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`truncate text-[15px] font-medium ${
                  active ? "text-brand-purple" : "text-ink"
                }`}
              >
                {product.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The signed-in Member's header for `/home`.
 * Nav: Home | Products ▾ | AI Renewal | How to Use
 * Right: Notifications, Activity, User chip.
 */
export function MemberHeader({
  products,
  onOpenProfile,
  onOpenNotifications,
}: {
  products: NavProduct[];
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [isDark, setIsDark] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const user = useCurrentUser();
  const { user: sessionUser, signOut, isSigningOut } = useSession();
  const { t, language, setLanguage } = useLanguage();
  const notifications = useNotifications();
  const activity = useActivityFeed();
  const unreadActivity = activity.items.filter((item) => !item.read);

  const canManage = sessionUser?.role === "admin" || sessionUser?.role === "super_admin";

  const isProductsActive =
    pathname?.startsWith("/docs/") || pathname?.startsWith("/admin/products");

  // Close right-side cluster on outside click
  useEffect(() => {
    if (!openMenu || openMenu === "products") return;
    function onClick(e: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  // Close products dropdown on outside click
  useEffect(() => {
    if (openMenu !== "products") return;
    function onClick(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  useEffect(() => {
    setIsDark(getStoredTheme() === "dark");
  }, []);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setIsDark(next === "dark");
  }

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  const navLinkClass = (active: boolean) =>
    `flex h-[72px] items-center gap-1.5 border-b-2 text-[16px] font-medium transition-all hover:border-brand-purple hover:font-bold hover:text-ink ${
      active ? "border-brand-purple font-bold text-ink" : "border-transparent text-muted"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-[55px] w-auto rounded-lg" />
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {/* Home */}
          <Link href="/home" className={navLinkClass(pathname === "/home")}>
            {t.nav.home}
          </Link>

          {/* Products dropdown */}
          <div ref={productsRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === "products"}
              onClick={() => toggleMenu("products")}
              className={`${navLinkClass(isProductsActive)} gap-1`}
            >
              {t.nav.products}
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-150 ${
                  openMenu === "products" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenu === "products" && (
              <ProductsDropdown
                products={products.filter((p) => p.key !== "ax-renewal")}
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>

          {/* AI Renewal */}
          <Link
            href="/ax-renewal"
            className={navLinkClass(pathname?.startsWith("/ax-renewal") ?? false)}
          >
            {t.nav.aiRenewal}
          </Link>

          {/* How to Use */}
          <Link
            href="/docs/get-started"
            className={navLinkClass(pathname?.startsWith("/docs/get-started") ?? false)}
          >
            {t.nav.howToUse}
          </Link>
        </nav>

        {/* Right-side chrome */}
        <div className="flex items-center gap-2" ref={clusterRef}>

          {/* Language picker */}
          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === "lang"}
              onClick={() => toggleMenu("lang")}
              className="relative flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-2 text-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              <GlobeIcon className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase">{language}</span>
            </button>

            {openMenu === "lang" && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-border bg-white py-2 shadow-lg"
              >
                <p className="px-4 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted">
                  Language
                </p>
                {(["en", "ko", "km"] as Language[]).map((lang) => {
                  const FLAG: Record<Language, string> = { en: "🇺🇸", ko: "🇰🇷", km: "🇰🇭" };
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="menuitem"
                      onClick={() => { setLanguage(lang); setOpenMenu(null); }}
                      className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-page ${
                        language === lang ? "font-semibold text-brand-purple" : "text-ink"
                      }`}
                    >
                      <span className="text-base">{FLAG[lang]}</span>
                      <span className="flex-1 text-left">{LANGUAGE_LABELS[lang]}</span>
                      {language === lang && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-purple" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
            onClick={toggleTheme}
            className={`rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
              isDark
                ? "bg-brand-purple/20 text-brand-purple"
                : "bg-gray-100 text-ink/70 hover:bg-brand-purple/20"
            }`}
          >
            {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <CountIcon
              count={notifications.unreadCount}
              label="Notifications"
              active={openMenu === "bell"}
              onClick={() => toggleMenu("bell")}
            >
              <BellIcon className="h-5 w-5" />
            </CountIcon>

            {openMenu === "bell" && (
              <div role="menu" className={PANEL_CLASSES}>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{t.notifications.title}</p>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {notifications.items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted">{t.notifications.empty}</p>
                  ) : (
                    notifications.items.map((n) => (
                      <div key={n.id} role="menuitem" className="flex items-start gap-3 px-4 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
                          <span className="block truncate text-xs text-muted">{n.detail}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="relative">
            <CountIcon
              count={activity.count}
              label="Activity"
              active={openMenu === "mail"}
              onClick={() => toggleMenu("mail")}
            >
              <MailIcon className="h-5 w-5" />
            </CountIcon>

            {openMenu === "mail" && (
              <div role="menu" className={PANEL_CLASSES}>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{t.activity.title}</p>
                  {activity.count > 0 && (
                    <button
                      type="button"
                      onClick={() => activity.markAllRead()}
                      className="text-xs font-semibold text-brand-purple hover:underline"
                    >
                      {t.activity.markAllRead}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {unreadActivity.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-muted">{t.activity.caughtUp}</p>
                  ) : (
                    unreadActivity.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => activity.markRead(item.id)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_GRADIENTS.purple}`}
                        >
                          {actorInitials(item)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{actorName(item)}</span>
                          <span className="block truncate text-xs text-muted">{item.summary}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">{timeAgo(item.occurredAt)}</span>
                        </span>
                        <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-purple" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => toggleMenu("user")}
              aria-haspopup="menu"
              aria-expanded={openMenu === "user"}
              className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-100 py-0.5 pl-1 pr-2.5 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl ?? null}
                initials={user?.initials ?? "?"}
                name={user?.name ?? "Guest"}
                className={`h-8 w-8 ${AVATAR_GRADIENTS.purple}`}
              />
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Guest"}</p>
                <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
              </div>
              <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
            </button>

            {openMenu === "user" && (
              <div role="menu" className={`${PANEL_CLASSES} w-64`}>
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <UserAvatar
                    avatarUrl={user?.avatarUrl ?? null}
                    initials={user?.initials ?? "?"}
                    name={user?.name ?? "Guest"}
                    className={`h-9 w-9 ${AVATAR_GRADIENTS.purple}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Guest"}</p>
                    <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setOpenMenu(null); onOpenProfile(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-page"
                  >
                    <PersonIcon className="h-4 w-4 text-muted" />
                    {t.menu.profile}
                  </button>
                  {canManage && (
                    <Link
                      href="/overview"
                      role="menuitem"
                      onClick={() => setOpenMenu(null)}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-page"
                    >
                      <ReturnIcon className="h-4 w-4 text-muted" />
                      Open Dashboard
                    </Link>
                  )}
                </div>
                <div className="border-t border-border py-1">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? <Spinner /> : <LogOutIcon className="h-4 w-4" />}
                    {isSigningOut ? t.menu.loggingOut : t.menu.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
