import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { SparklesIcon } from "@/components/layout/icons";

export default function IdeaPage() {
  return (
    <ComingSoonPage
      pageTitle="IDEA"
      titleIcon={<SparklesIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
      icon={<SparklesIcon className="h-7 w-7" />}
    />
  );
}
