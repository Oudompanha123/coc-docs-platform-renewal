import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { DOCS_HEADERS } from "@/lib/docs/jexmcp-nav";

const header = DOCS_HEADERS.find((h) => h.key === "coach")!;

export default function CoachOverviewPage() {
  return <DocsStubPage header={header} item={header.items[0]!} />;
}
