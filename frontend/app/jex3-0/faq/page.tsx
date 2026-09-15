"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex3-0", "faq");

export default function Jex30FaqPage() {
  const content = useDocContent(ID);

  return (
    <AppShell
      pageTitle="Jex3.0 — FAQ"
      pageSubtitle="Quick answers to common jexmcp problems — servers, sessions, SVN, and more."
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      {content && <ContentRenderer content={content} variant="admin" />}
    </AppShell>
  );
}
