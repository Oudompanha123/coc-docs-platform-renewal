import { AppShell } from "@/components/layout/AppShell";
import { PersonIcon } from "@/components/layout/icons";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";

export default function CoachManagePage() {
  return (
    <AppShell
      pageTitle="Coach"
      pageSubtitle="Manage Coach's knowledge base content"
      titleIcon={<PersonIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <ProductContentTable productKey="coach" />
    </AppShell>
  );
}
