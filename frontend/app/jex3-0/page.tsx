import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";

export default function Jex30ManagePage() {
  return (
    <AppShell
      pageTitle="Jex3.0"
      pageSubtitle="Manage Jex3.0's knowledge base content"
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <ProductContentTable productKey="jex3-0" />
    </AppShell>
  );
}
