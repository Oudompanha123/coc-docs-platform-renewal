"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex3-0", "flow");

export default function Jex30FlowPage() {
  const content = useDocContent(ID);

  return (
    <AppShell
      pageTitle="Jex3.0 — Flow"
      pageSubtitle="Connect your dev work to flow.team — tasks update themselves as you build and commit."
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      {content && <ContentRenderer content={content} variant="admin" />}
    </AppShell>
  );
}
