import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_DOCUMENTS } from "@/components/legal/content";

export const metadata: Metadata = {
  title: `${LEGAL_DOCUMENTS.privacy.name} · Coc Docs Platform`,
  description: LEGAL_DOCUMENTS.privacy.description,
};

/**
 * `/privacy` — opened from the "Privacy Policy" link on the registration
 * form's agreement checkbox.
 *
 * // req: FR-AUTH-002
 */
export default function PrivacyPage() {
  return <LegalPage docKey="privacy" />;
}
