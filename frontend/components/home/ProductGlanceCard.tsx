import Link from "next/link";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { LayersIcon } from "@/components/layout/icons";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { StatCardData } from "@/lib/mock/overview";
import { productHref } from "@/lib/home/product-links";

/** One product's real coverage, as a progress bar rather than the Overview
 *  page's plain number — this page is about picking up unfinished work, so
 *  how much of the bar is filled matters more here than it does there. */
export function ProductGlanceCard({ product, stat }: { product: NavProduct; stat: StatCardData }) {
  const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
  const [writtenRaw, totalRaw] = stat.value.split("/");
  const written = Number(writtenRaw?.trim() ?? "0");
  const total = Number(totalRaw?.trim() ?? "0");
  const pct = total > 0 ? Math.round((written / total) * 100) : 0;

  return (
    <Link
      href={productHref(product.key)}
      className="block rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${AVATAR_GRADIENTS[stat.tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="truncate text-sm font-semibold text-dash-ink">{product.label}</p>
      </div>

      <p className="mt-3 text-lg font-semibold text-dash-ink">{stat.value}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-page">
        <div className={`h-full rounded-full ${AVATAR_GRADIENTS[stat.tone]}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${stat.trendTone === "positive" ? "text-[#1f9d6b]" : "text-[#e0873c]"}`}>
        {stat.trend}
      </p>
    </Link>
  );
}
