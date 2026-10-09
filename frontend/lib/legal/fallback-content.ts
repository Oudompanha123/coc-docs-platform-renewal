import type { LegalContent } from "./content-types";

/**
 * Last-known-good copy for `/privacy` — mirrors the published row the
 * legal-pages migration seeds, word for word. Used only when the public API
 * (`fetchPublicLegalPage`) is unreachable, so a backend outage never turns
 * this page blank; an admin's actual edits always win once the fetch
 * succeeds.
 *
 * Keyed only by `"privacy"`, not the broader `LegalSlug` — Terms moved to
 * the new document-shaped admin editor and has no public page any more, so
 * there's nothing for a `terms` fallback to stand in for here.
 */

const CTA = {
  title: "Have a question?",
  text: "Our team is happy to explain anything on this page.",
};

const EYEBROW = "Coc Docs Platform · Legal";

export const LEGAL_FALLBACK_CONTENT: Record<"privacy", LegalContent> = {
  privacy: {
    title: "Privacy Policy",
    lead: "What we collect, why, and the choices you have.",
    eyebrow: EYEBROW,
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "check",
    highlights: [
      { icon: "eye", title: "Only what's needed", text: "Name, email, and your activity on the platform." },
      { icon: "lock", title: "Kept safe", text: "Passwords are hashed. Access is limited by role." },
      { icon: "shield", title: "Never sold", text: "We don't sell or share your data for ads." },
    ],
    plainLanguage:
      "We collect what we need to sign you in and run the platform. We don't sell anything, and there are no advertising trackers on this site.",
    sections: [
      {
        id: "information-we-collect",
        title: "Information we collect",
        icon: "database",
        body: [
          "- Account details: full name, email, and password (stored hashed).",
          "- Activity: sign-ins, sessions, and documents you view or edit.",
          "- HRMS attendance — only if an admin links your account.",
        ].join("\n"),
      },
      {
        id: "how-we-use-it",
        title: "How we use it",
        icon: "server",
        body: "To run the platform: sign you in, show your documents and usage, and keep your account secure.",
      },
      {
        id: "who-can-see-your-data",
        title: "Who can see your data",
        icon: "eye",
        body: "Admins can see account details and activity needed to manage the team. Other users can't see your attendance.",
      },
      {
        id: "how-long-we-keep-it",
        title: "How long we keep it",
        icon: "history",
        body: "We keep your data while your account is active, and delete or anonymise it after it's no longer needed.",
      },
      {
        id: "your-choices",
        title: "Your choices",
        icon: "sliders",
        body: "You can update your name, change notification settings, and sign out of other devices in Settings.",
      },
    ],
    cta: CTA,
  },
};
