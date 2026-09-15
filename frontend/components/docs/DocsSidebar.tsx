"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DocumentIcon,
  HomeIcon,
  PlayIcon,
  QuestionIcon,
  SparklesIcon,
  TagIcon,
} from "@/components/layout/icons";
import { DocsHeaderSwitcher } from "./DocsHeaderSwitcher";
import { DOCS_HEADERS, headerForPathname, hrefFor } from "@/lib/docs/jexmcp-nav";

const DOCS_NAV = [
  { label: "Overview", href: "/docs", icon: HomeIcon },
  { label: "Get started", href: "/docs/get-started", icon: PlayIcon },
  { label: "How to use", href: "/docs/how-to-use", icon: SparklesIcon },
  { label: "Releases", href: "/docs/releases", icon: TagIcon },
  { label: "FAQ", href: "/docs/faq", icon: QuestionIcon },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const activeHeader = headerForPathname(pathname) ?? DOCS_HEADERS[0]!;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-6">
        <Link href="/welcome" className="flex items-center gap-2.5 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-white">
            <DocumentIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-ink">Coc Docs Platform</span>
        </Link>

        <nav className="mt-6 space-y-1">
          {DOCS_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-purple/10 text-brand-purple" : "text-muted hover:bg-page hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex-1 border-t border-border pt-6">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Knowledge base</p>

          <div className="mt-3">
            <DocsHeaderSwitcher active={activeHeader} />
          </div>

          <nav className="mt-3 space-y-0.5">
            {activeHeader.items.map((item) => {
              const href = hrefFor(activeHeader.key, item.slug);
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-brand-purple/10 font-semibold text-brand-purple" : "text-muted hover:bg-page hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link href="/welcome" className="px-3 text-xs font-medium text-muted hover:text-ink">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
