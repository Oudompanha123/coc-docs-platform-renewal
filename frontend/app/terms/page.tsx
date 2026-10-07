import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_DOCUMENTS } from "@/components/legal/content";

export const metadata: Metadata = {
  title: `${LEGAL_DOCUMENTS.terms.name} · Coc Docs Platform`,
  description: LEGAL_DOCUMENTS.terms.description,
};

/**
 * `/terms` — opened from the "Terms of Service" link on the registration
 * form's agreement checkbox.
 *
 * // req: FR-AUTH-002
 */
export default function TermsPage() {
  return <LegalPage docKey="terms" />;
}
