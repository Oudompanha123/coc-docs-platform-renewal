import { AppShell } from "@/components/layout/AppShell";
import { PulseIcon } from "@/components/layout/icons";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";

export default function TeamManagePage() {
  return (
    <AppShell
      pageTitle="Team"
      pageSubtitle="Manage Team's knowledge base content"
      titleIcon={<PulseIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <ProductContentTable productKey="team" />
    </AppShell>
  );
}
