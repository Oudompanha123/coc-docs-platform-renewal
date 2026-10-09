"use client";

import Link from "next/link";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { LayersIcon } from "@/components/layout/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { StatCardData } from "@/lib/mock/overview";
import { productHref } from "@/lib/home/product-links";

/** "Your products" — one real chip per product, its status read straight
 *  from the same `computeProductStats` numbers as the glance cards above,
 *  not a second judgment about what counts as "written". */
export function ProductsStrip({ products, stats }: { products: NavProduct[]; stats: StatCardData[] }) {
  const { t } = useLanguage();
  return (
    <section id="products" className="animate-entrance border-y border-surface-border bg-background px-6 py-8">
      <p className="text-center text-xs font-medium text-muted-foreground">{t.productsStrip.label}</p>
      <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        {products.map((product) => {
          const stat = stats.find((s) => s.id === product.key);
          const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
          const allWritten = stat?.trendTone === "positive";
          return (
            <Link
              key={product.key}
              href={productHref(product.key)}
              className="flex h-9 items-center gap-2 rounded-full border border-surface-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${AVATAR_GRADIENTS[stat?.tone ?? "purple"]}`}>
                <Icon className="h-3 w-3" />
              </span>
              {product.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  allWritten ? "bg-[#e1f5ec] text-[#1f9d6b]" : "bg-[#fdf1de] text-[#c98a2c]"
                }`}
              >
                {stat?.value ?? "…"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
