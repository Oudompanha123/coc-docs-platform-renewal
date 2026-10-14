import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { PulseIcon } from "@/components/layout/icons";

export default function WorkflowPage() {
  return (
    <ComingSoonPage
      pageTitle="Workflow"
      titleIcon={<PulseIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
      icon={<PulseIcon className="h-7 w-7" />}
    />
  );
}
