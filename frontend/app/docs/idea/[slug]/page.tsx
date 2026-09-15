import { notFound } from "next/navigation";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import type { DocsHeaderNav } from "@/lib/docs/jexmcp-nav";

// "idea" is no longer one of the 5 confirmed headers — see app/docs/idea/page.tsx.
const header: DocsHeaderNav | undefined = undefined;

export default async function IdeaSubPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!header) notFound();
  const { slug } = await params;
  const item = header.items.find((i) => i.slug === slug);
  if (!item) notFound();
  return <DocsStubPage header={header} item={item} />;
}
