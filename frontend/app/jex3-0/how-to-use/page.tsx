"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex3-0", "how-to-use");

export default function Jex30HowToUsePage() {
  const content = useDocContent(ID);

  return (
    <AppShell
      pageTitle="Jex3.0 — How to use"
      pageSubtitle="Build screens, create IDOs, clone modules, and keep SVN in sync — just describe the task."
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      {content && <ContentRenderer content={content} variant="admin" />}
    </AppShell>
  );
}
