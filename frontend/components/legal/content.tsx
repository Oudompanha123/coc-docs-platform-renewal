import type { ReactNode } from "react";
import { ClockIcon, DatabaseIcon, DocumentIcon, PersonIcon } from "@/components/layout/icons";
import { LockIcon, ShieldIcon } from "@/components/auth/icons";
import {
  EyeOpenIcon,
  HistoryIcon,
  KeyIcon,
  ScaleIcon,
  ServerIcon,
  ShieldCheckIcon,
  SlidersIcon,
} from "@/components/legal/icons";
import { Bullets, type LegalIcon } from "@/components/legal/parts";

export type LegalDocKey = "terms" | "privacy";

export type LegalSection = {
  /** Anchor id — also what the table of contents links to. */
  id: string;
  title: string;
  icon: LegalIcon;
  body: ReactNode;
};

export type LegalHighlight = { icon: LegalIcon; title: string; body: string };

export type LegalDoc = {
  key: LegalDocKey;
  /** The document's own name, used in the heading, the breadcrumb and the page title. */
  name: string;
  path: string;
  /** One line under the heading, saying what the document covers. */
  summary: string;
  description: string;
  readingTime: string;
  /** Plain-language opening, before section 1. */
  lede: string;
  highlights: LegalHighlight[];
  sections: LegalSection[];
};

/** Shown in the hero and in each document's footer. One date for both documents. */
export const LEGAL_LAST_UPDATED = "1 Oct 2026";

/**
 * The Terms of Service and the Privacy Policy, as data.
 *
 * <p>Deliberately short: five sections each, one screen of plain language,
 * written so somebody halfway through registering actually reads them. Both
 * describe how this application behaves — approval-gated accounts (ADR-021),
 * roles read server-side per request (ADR-011), an append-only audit log,
 * HRMS attendance only once an administrator links the account. When one of
 * those changes, this copy changes with it.
 *
 * <p>The wording is a first draft written against the product, not reviewed
 * legal text. The date is a placeholder until the business confirms it.
 */
export const LEGAL_DOCUMENTS: Record<LegalDocKey, LegalDoc> = {
  terms: {
    key: "terms",
    name: "Terms of Service",
    path: "/terms",
    summary: "What you agree to when you use the platform.",
    description: "The terms you accept when you register for Coc Docs Platform.",
    readingTime: "1 min read",
    lede: "You need an approved account, your organisation owns what you publish, and every change is recorded. Ticking the agreement box on the registration form accepts this document and the Privacy Policy.",
    highlights: [
      {
        icon: PersonIcon,
        title: "Approved accounts",
        body: "Register, confirm your email, then an admin approves you.",
      },
      {
        icon: DocumentIcon,
        title: "Your content stays yours",
        body: "Your organisation owns every page you publish.",
      },
      {
        icon: HistoryIcon,
        title: "Every change is recorded",
        body: "Versions and an audit trail, kept for at least a year.",
      },
    ],
    sections: [
      {
        id: "your-account",
        title: "Your account",
        icon: PersonIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            Register with your work email, confirm the code we send, then wait for an admin to approve the account. One
            account per person — don’t share your password, and tell an admin if you think it has been exposed.
          </p>
        ),
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        icon: ShieldCheckIcon,
        body: (
          <>
            <p className="mb-2.5 max-w-[70ch]">Use the platform for your organisation’s documentation. Please don’t:</p>
            <Bullets
              marker="dot"
              items={[
                "store live secrets — passwords, API keys, certificates — in page content;",
                "upload material you have no right to share;",
                "reach for content, settings or accounts your role doesn’t grant you.",
              ]}
            />
          </>
        ),
      },
      {
        id: "your-content",
        title: "Your content",
        icon: DocumentIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            Your organisation owns the documentation you create. We store and serve it so the platform works, and we
            never use it to train models.
          </p>
        ),
      },
      {
        id: "roles-and-admins",
        title: "Roles and admins",
        icon: KeyIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            What you can see and change comes from the role on your account, checked on the server for every request.
            Admins can approve, suspend, or remove an account; the pages you wrote stay with the organisation.
          </p>
        ),
      },
      {
        id: "service-and-changes",
        title: "Service and changes",
        icon: ScaleIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            We aim to keep the platform available during working hours, but can’t promise uninterrupted service. If
            these terms change in a way that matters, we’ll update the date above and tell you at your next sign-in.
          </p>
        ),
      },
    ],
  },

  privacy: {
    key: "privacy",
    name: "Privacy Policy",
    path: "/privacy",
    summary: "What we collect, why, and the choices you have.",
    description: "What Coc Docs Platform collects about you, why, and for how long.",
    readingTime: "1 min read",
    lede: "We collect what we need to sign you in and run the platform. We don’t sell anything, and there are no advertising trackers on this site.",
    highlights: [
      {
        icon: EyeOpenIcon,
        title: "Only what’s needed",
        body: "Name, email, and your activity on the platform.",
      },
      {
        icon: LockIcon,
        title: "Kept safe",
        body: "Passwords are hashed. Access is limited by role.",
      },
      {
        icon: ShieldIcon,
        title: "Never sold",
        body: "We don’t sell or share your data for ads.",
      },
    ],
    sections: [
      {
        id: "information-we-collect",
        title: "Information we collect",
        icon: DatabaseIcon,
        body: (
          <Bullets
            items={[
              <>
                <strong className="font-semibold text-ink">Account details:</strong> full name, email, and password
                (stored hashed).
              </>,
              <>
                <strong className="font-semibold text-ink">Activity:</strong> sign-ins, sessions, and documents you
                view or edit.
              </>,
              <>
                <strong className="font-semibold text-ink">HRMS attendance</strong> — only if an admin links your
                account.
              </>,
            ]}
          />
        ),
      },
      {
        id: "how-we-use-it",
        title: "How we use it",
        icon: ServerIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            To run the platform: sign you in, show your documents and usage, and keep your account secure.
          </p>
        ),
      },
      {
        id: "who-can-see-your-data",
        title: "Who can see your data",
        icon: EyeOpenIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            Admins can see account details and activity needed to manage the team. Other users can’t see your
            attendance.
          </p>
        ),
      },
      {
        id: "how-long-we-keep-it",
        title: "How long we keep it",
        icon: ClockIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            We keep your data while your account is active, and delete or anonymise it after it’s no longer needed.
          </p>
        ),
      },
      {
        id: "your-choices",
        title: "Your choices",
        icon: SlidersIcon,
        body: (
          <p className="m-0 max-w-[70ch]">
            You can update your name, change notification settings, and sign out of other devices in Settings.
          </p>
        ),
      },
    ],
  },
};
