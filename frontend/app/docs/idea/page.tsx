import { notFound } from "next/navigation";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import type { DocsHeaderNav } from "@/lib/docs/jexmcp-nav";

// "idea" is no longer one of the 5 confirmed headers (it was IDEA/Workflow
// splitting off what should have been a single "Team" header) — DOCS_HEADERS
// no longer has an entry for it, or even the type-level slot for one. Left
// as a graceful 404 rather than deleted, pending a decision on what (if
// anything) happens to this route.
const header: DocsHeaderNav | undefined = undefined;

export default function IdeaOverviewPage() {
  if (!header) notFound();
  return <DocsStubPage header={header} item={header.items[0]!} />;
}
