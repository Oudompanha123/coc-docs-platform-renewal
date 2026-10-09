import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { SparklesIcon } from "@/components/layout/icons";

export default function IdeaPage() {
  return (
    <ComingSoonPage
      pageTitle="IDEA"
      titleIcon={<SparklesIcon className="hidden h-8 w-8 shrink-0 text-foreground sm:block" />}
      icon={<SparklesIcon className="h-7 w-7" />}
    />
  );
}
