"use client";

import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { useDocContent } from "@/lib/docs/useDocContent";
import { contentId } from "@/lib/docs/content-store";

const ID = contentId("jex2-0", "how-to-use");

export default function Jex20HowToUsePage() {
  const content = useDocContent(ID);
  return content ? <ContentRenderer content={content} variant="docs" /> : null;
}
