import { AppShell } from "@/components/layout/AppShell";
import { BarChartIcon } from "@/components/layout/icons";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";

/** Manages the docs-content "Usage" product (Dashboard/Setup guide/
 *  Configuration) — distinct from the real Claude Code Usage dashboard,
 *  which still lives at /claude-usage (no longer linked from the sidebar,
 *  per explicit confirmation). */
export default function UsageManagePage() {
  return (
    <AppShell
      pageTitle="Usage"
      pageSubtitle="Manage Usage's knowledge base content"
      titleIcon={<BarChartIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <ProductContentTable productKey="usage" />
    </AppShell>
  );
}
