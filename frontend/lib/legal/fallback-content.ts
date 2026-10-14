import type { LegalSlug } from "./legal-api";
import type { LegalDocumentContent } from "./legal-document";

/**
 * Last-known-good copy for `/terms` and `/privacy`, in the V81 one-body
 * shape — the seed content the migrations converted, so a backend outage
 * never turns a legal page blank. An admin's published edits always win once
 * `fetchPublicLegalPage` succeeds.
 */

const SUBTITLE = "Coc Docs Platform · Legal Information";
const END_NOTE = "---\n\n*The information on this page may change without notice.*\n\n*© 2026 Coc Docs Platform. All rights reserved.*";

export const LEGAL_FALLBACK_CONTENT: Record<LegalSlug, LegalDocumentContent> = {
  terms: {
    title: "Terms of Service",
    subtitle: SUBTITLE,
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: [
      "## Agreement to These Terms",
      "These Terms of Service apply to Coc Docs Platform and every page, tool, and service it provides. By creating an account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.",
      "## Your Account",
      "You need an approved account to use the Platform. You are responsible for keeping your password private and for all activity under your account.",
      "## Acceptable Use",
      "Use the Platform only for your organisation's documentation work. You agree that you will not:\n\n- store live secrets — passwords, API keys, or certificates — in page content;\n- upload material you have no right to share;\n- try to access content, settings, or accounts your role does not allow;\n- disrupt or overload the Platform, or try to get around its security.",
      "## Your Content",
      "Your organisation owns the documentation you create. Every change is recorded, and versions are kept for at least one year.",
      "## Related Policies",
      "- [Privacy Policy](/privacy)",
      "## Contact",
      "Questions about these Terms? Contact the platform team at [legal@example.com](mailto:legal@example.com).",
      END_NOTE,
    ].join("\n\n"),
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "What we collect, why, and the choices you have.",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: [
      "> We collect what we need to sign you in and run the platform. We don't sell anything, and there are no advertising trackers on this site.",
      "## Information we collect",
      "- Account details: full name, email, and password (stored hashed).\n- Activity: sign-ins, sessions, and documents you view or edit.\n- HRMS attendance — only if an admin links your account.",
      "## How we use it",
      "To run the platform: sign you in, show your documents and usage, and keep your account secure.",
      "## Who can see your data",
      "Admins can see account details and activity needed to manage the team. Other users can't see your attendance.",
      "## How long we keep it",
      "We keep your data while your account is active, and delete or anonymise it after it's no longer needed.",
      "## Your choices",
      "You can update your name, change notification settings, and sign out of other devices in Settings.",
      "## Contact",
      "Questions about this Privacy Policy? Contact the platform team at [legal@example.com](mailto:legal@example.com).",
      END_NOTE,
    ].join("\n\n"),
  },
};
