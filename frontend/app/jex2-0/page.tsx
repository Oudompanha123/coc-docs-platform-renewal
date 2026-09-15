import { AppShell } from "@/components/layout/AppShell";
import { FolderIcon } from "@/components/layout/icons";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";

export default function Jex20ManagePage() {
  return (
    <AppShell
      pageTitle="Jex2.0"
      pageSubtitle="Manage Jex2.0's knowledge base content"
      titleIcon={<FolderIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <ProductContentTable productKey="jex2-0" />
    </AppShell>
  );
}
