"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex3-0", "");

/** Reads from the shared content store (lib/docs/content-store.ts) — the
 *  same store the admin editor at /content writes to. No hardcoded JSX
 *  content lives here anymore. */
export default function Jex30OverviewPage() {
  const content = useDocContent(ID);

  return (
    <AppShell
      pageTitle="Jex3.0"
      pageSubtitle="One install. Every workspace. JEX Studio automation as a Claude Code plugin."
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      {content && <ContentRenderer content={content} variant="admin" />}
    </AppShell>
  );
}
