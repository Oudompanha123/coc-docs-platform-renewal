import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { DOCS_HEADERS } from "@/lib/docs/jexmcp-nav";

const header = DOCS_HEADERS.find((h) => h.key === "usage")!;

export default function UsageOverviewPage() {
  return <DocsStubPage header={header} item={header.items[0]!} />;
}
