import Link from "next/link";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { LayersIcon } from "@/components/layout/icons";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { StatCardData } from "@/lib/mock/overview";
import { productHref } from "@/lib/home/product-links";

/** "Your products" — one real chip per product, its status read straight
 *  from the same `computeProductStats` numbers as the glance cards above,
 *  not a second judgment about what counts as "written". */
export function ProductsStrip({ products, stats }: { products: NavProduct[]; stats: StatCardData[] }) {
  return (
    <section id="products" className="animate-entrance border-y border-border bg-white px-6 py-10">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">Your products</p>
      <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-3">
        {products.map((product) => {
          const stat = stats.find((s) => s.id === product.key);
          const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
          const allWritten = stat?.trendTone === "positive";
          return (
            <Link
              key={product.key}
              href={productHref(product.key)}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-shadow hover:shadow-md"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${AVATAR_GRADIENTS[stat?.tone ?? "purple"]}`}>
                <Icon className="h-3 w-3" />
              </span>
              {product.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
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
