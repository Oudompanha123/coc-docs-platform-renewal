"use client";

import Link from "next/link";
import { usePathname } from "@/lib/i18n/navigation";
import {
  DocumentIcon,
  HomeIcon,
  PlayIcon,
  QuestionIcon,
  SparklesIcon,
  TagIcon,
} from "@/components/layout/icons";
import { DocsHeaderSwitcher } from "./DocsHeaderSwitcher";
import { hrefFor, productForPathname } from "@/lib/docs/nav-routing";
import { useNavStructure } from "@/lib/docs/useNavStructure";

const DOCS_NAV = [
  { label: "Overview", href: "/docs", icon: HomeIcon },
  { label: "Get started", href: "/docs/get-started", icon: PlayIcon },
  { label: "How to use", href: "/docs/how-to-use", icon: SparklesIcon },
  { label: "Releases", href: "/docs/releases", icon: TagIcon },
  { label: "FAQ", href: "/docs/faq", icon: QuestionIcon },
];

/**
 * Where the brand mark and "Back to site" lead: the bare domain, which sends
 * each visitor where they belong (`app/page.tsx` → `landingPathFor`) — the
 * public page when signed out, the Member home for a signed-in user, the
 * Overview for an admin. Both links used to hard-code `/welcome`, so a member
 * reading the docs was sent off their own home to the public page.
 */
export const DOCS_SITE_HOME_HREF = "/";

export function DocsSidebar() {
  const pathname = usePathname();
  const products = useNavStructure();
  const activeProduct = products ? (productForPathname(products, pathname) ?? products[0]) : undefined;

  return (
    <aside className="hidden w-60 shrink-0 border-r border-surface-border lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-3 py-4">
        <Link href={DOCS_SITE_HOME_HREF} className="flex items-center gap-2.5 px-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DocumentIcon className="size-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">Coc Docs Platform</span>
        </Link>

        <nav className="mt-5 space-y-0.5">
          {DOCS_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex-1 border-t border-surface-border pt-4">
          <p className="px-2 text-xs font-medium text-muted-foreground">Knowledge base</p>

          {activeProduct && (
            <>
              <div className="mt-3">
                <DocsHeaderSwitcher active={activeProduct} products={products ?? []} />
              </div>

              <nav className="mt-3 space-y-0.5">
                {activeProduct.items.map((item) => {
                  const href = hrefFor(activeProduct.key, item.slug);
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`flex h-8 items-center rounded-md px-2 text-sm transition-colors ${
                        active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        <Link href={DOCS_SITE_HOME_HREF} className="px-2 pt-3 text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
