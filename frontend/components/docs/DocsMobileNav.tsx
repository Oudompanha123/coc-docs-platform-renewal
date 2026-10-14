"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { HomeIcon, PlayIcon, QuestionIcon, SparklesIcon, TagIcon } from "@/components/layout/icons";
import { hrefFor, productForPathname } from "@/lib/docs/nav-routing";
import { useNavStructure } from "@/lib/docs/useNavStructure";
import { SimpleSelect } from "@/components/ui/select";

const DOCS_NAV = [
  { label: "Overview", href: "/docs", icon: HomeIcon },
  { label: "Get started", href: "/docs/get-started", icon: PlayIcon },
  { label: "How to use", href: "/docs/how-to-use", icon: SparklesIcon },
  { label: "Releases", href: "/docs/releases", icon: TagIcon },
  { label: "FAQ", href: "/docs/faq", icon: QuestionIcon },
];

/** The sidebar's mobile fallback, shown only below lg: the existing Coc Docs
 *  Platform nav as a scrollable pill row, plus a header <select> + a second
 *  scrollable row for the active header's sub-items. */
export function DocsMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const products = useNavStructure();
  const activeProduct = products ? (productForPathname(products, pathname) ?? products[0]) : undefined;

  return (
    <div className="border-b border-surface-border lg:hidden">
      <nav className="flex gap-1 overflow-x-auto px-4 py-2">
        {DOCS_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {activeProduct && (
        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-2">
          <SimpleSelect
            size="sm"
            aria-label="Knowledge base section"
            value={activeProduct.key}
            onValueChange={(key) => {
              const product = products?.find((p) => p.key === key);
              if (product) router.push(hrefFor(product.key, product.items[0]?.slug ?? ""));
            }}
            options={(products ?? []).map((product) => ({ value: product.key, label: product.label }))}
            className="w-auto shrink-0 font-medium"
          />

          <nav className="flex gap-1 overflow-x-auto">
            {activeProduct.items.map((item) => {
              const href = hrefFor(activeProduct.key, item.slug);
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex h-8 shrink-0 items-center rounded-full px-3 text-sm font-medium transition-colors ${
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
