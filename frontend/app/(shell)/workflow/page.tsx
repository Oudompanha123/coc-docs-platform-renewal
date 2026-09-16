import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { PulseIcon } from "@/components/layout/icons";

export default function WorkflowPage() {
  return (
    <ComingSoonPage
      pageTitle="Workflow"
      titleIcon={<PulseIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
      icon={<PulseIcon className="h-7 w-7" />}
    />
  );
}
