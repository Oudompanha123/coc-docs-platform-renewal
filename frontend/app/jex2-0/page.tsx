import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { FolderIcon } from "@/components/layout/icons";

export default function Jex2Page() {
  return (
    <ComingSoonPage
      pageTitle="Jex2.0"
      titleIcon={<FolderIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
      icon={<FolderIcon className="h-7 w-7" />}
    />
  );
}
