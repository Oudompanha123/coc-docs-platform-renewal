"use client";

import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex2-0", "get-started");

export default function Jex20GetStartedPage() {
  const content = useDocContent(ID);
  return content ? <ContentRenderer content={content} variant="docs" /> : null;
}
