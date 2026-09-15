import { notFound } from "next/navigation";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { DOCS_HEADERS } from "@/lib/docs/jexmcp-nav";

const header = DOCS_HEADERS.find((h) => h.key === "idea")!;

export default async function IdeaSubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = header.items.find((i) => i.slug === slug);
  if (!item) notFound();
  return <DocsStubPage header={header} item={item} />;
}
