import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { PersonIcon } from "@/components/layout/icons";

export default function CoachPage() {
  return (
    <ComingSoonPage
      pageTitle="Coach"
      titleIcon={<PersonIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
      icon={<PersonIcon className="h-7 w-7" />}
    />
  );
}
