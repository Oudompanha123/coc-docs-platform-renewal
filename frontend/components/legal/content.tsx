import type { ReactNode } from "react";
import { Bullets, Para, PolicyLinks } from "@/components/legal/parts";

export type LegalDocKey = "terms" | "privacy";

export type LegalSection = {
  /** Anchor id — what `Related Policies` and any external deep link point at. */
  id: string;
  title: string;
  body: ReactNode;
};

export type LegalDoc = {
  key: LegalDocKey;
  /** The document's own name, used in the heading and the page title. */
  name: string;
  path: string;
  /** Centred line under the heading. */
  subtitle: string;
  description: string;
  sections: LegalSection[];
};

/** Shown in each document's footer. One date for both documents. */
export const LEGAL_LAST_UPDATED = "1 Oct 2026";

/** Shown in each document's footer, beside the copyright symbol. */
export const LEGAL_COPYRIGHT_YEAR = "2026";

/**
 * The banner both documents carry, above the rule.
 *
 * <p>The wording below is a first draft written against how the product
 * actually behaves — approval-gated accounts (ADR-021), roles read
 * server-side per request (ADR-011), an append-only audit log, HRMS
 * attendance only once an administrator links the account. It is **not**
 * reviewed legal text, and the badge says so on the page rather than only in
 * this comment. Delete the badge when the business supplies approved copy.
 */
export const LEGAL_SAMPLE_NOTICE = "Sample text — replace with approved legal content";

/** Both documents carry the same subtitle, under their own name. */
const SUBTITLE = "Coc Docs Platform · Legal Information";

/** Placeholder until the business names a real mailbox. */
const CONTACT_EMAIL = "legal@example.com";

/**
 * The Terms of Service and the Privacy Policy, as data.
 *
 * <p>One shape for both, so `LegalPage` renders either from the route alone.
 * Each is a plain sequence of titled sections — no highlights, no reading
 * time, no per-section icon: the page is a legal document, and anything that
 * decorates it is something a reader has to look past.
 */
export const LEGAL_DOCUMENTS: Record<LegalDocKey, LegalDoc> = {
  terms: {
    key: "terms",
    name: "Terms of Service",
    path: "/terms",
    subtitle: SUBTITLE,
    description: "The terms you accept when you register for Coc Docs Platform.",
    sections: [
      {
        id: "agreement-to-these-terms",
        title: "Agreement to These Terms",
        body: (
          <>
            <Para>
              These Terms of Service (the “Terms”) apply to Coc Docs Platform and every page, tool, and service it
              provides (together, the “Platform”). The Platform is operated by your organisation. BY CREATING AN
              ACCOUNT OR USING THE PLATFORM, YOU AGREE TO THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE PLATFORM.
            </Para>
            <Para>
              We may change these Terms at any time. When we do, we update the date at the bottom of this page and tell
              you at your next sign-in. Using the Platform after a change means you accept the new Terms.
            </Para>
          </>
        ),
      },
      {
        id: "your-account",
        title: "Your Account",
        body: (
          <>
            <Para>
              You need an approved account to use the Platform. Register with your work email, confirm the code we send
              you, then wait for an admin to approve the account.
            </Para>
            <Para>
              You are responsible for keeping your password private and for all activity under your account. One
              account per person. If you think your password has been exposed, tell an admin right away.
            </Para>
          </>
        ),
      },
      {
        id: "acceptable-use",
        title: "Acceptable Use",
        body: (
          <>
            <Para>Use the Platform only for your organisation’s documentation work. You agree that you will not:</Para>
            <Bullets
              items={[
                "store live secrets — passwords, API keys, or certificates — in page content;",
                "upload material you have no right to share;",
                "try to access content, settings, or accounts your role does not allow;",
                "disrupt or overload the Platform, or try to get around its security.",
              ]}
            />
          </>
        ),
      },
      {
        id: "your-content",
        title: "Your Content",
        body: (
          <>
            <Para>
              Your organisation owns the documentation you create. We store and serve it so the Platform works. We
              never use your content to train models.
            </Para>
            <Para>Every change is recorded. Versions and an audit trail are kept for at least one year.</Para>
          </>
        ),
      },
      {
        id: "roles-and-admins",
        title: "Roles and Admins",
        body: (
          <Para>
            What you can see and change depends on the role on your account, and is checked on the server for every
            request. Admins can approve, suspend, or remove an account. Pages you wrote stay with the organisation.
          </Para>
        ),
      },
      {
        id: "related-policies",
        title: "Related Policies",
        body: (
          <>
            <Para>
              The following policies also apply to your use of the Platform and are part of these Terms:
            </Para>
            <PolicyLinks
              items={[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Acceptable Use Guidelines", href: "/terms#acceptable-use" },
                { label: "Security Contacts", href: "/terms#contact" },
              ]}
            />
            <Para>Each of these policies may change from time to time and applies from when it is posted.</Para>
          </>
        ),
      },
      {
        id: "disclaimers",
        title: "Disclaimers",
        body: (
          <Para>
            THE PLATFORM IS PROVIDED “AS IS” AND “AS AVAILABLE”. WE DO NOT PROMISE THAT THE PLATFORM WILL BE ERROR-FREE
            OR UNINTERRUPTED, OR THAT ANY CONTENT WILL BE ACCURATE OR UP TO DATE. YOU USE THE PLATFORM AT YOUR OWN
            RISK.
          </Para>
        ),
      },
      {
        id: "service-and-changes",
        title: "Service and Changes",
        body: (
          <Para>
            We aim to keep the Platform available during working hours, but we can’t promise uninterrupted service. We
            may change, pause, or stop any part of the Platform at any time.
          </Para>
        ),
      },
      {
        id: "contact",
        title: "Contact",
        body: <Para>Questions about these Terms? Contact the platform team at {CONTACT_EMAIL}.</Para>,
      },
    ],
  },

  privacy: {
    key: "privacy",
    name: "Privacy Policy",
    path: "/privacy",
    subtitle: SUBTITLE,
    description: "What Coc Docs Platform collects about you, why, and for how long.",
    sections: [
      {
        id: "about-this-policy",
        title: "About This Policy",
        body: (
          <>
            <Para>
              This Privacy Policy explains what Coc Docs Platform (the “Platform”) collects about you, why we collect
              it, and how long we keep it. The Platform is operated by your organisation.
            </Para>
            <Para>
              We may change this Policy at any time. When we do, we update the date at the bottom of this page. Using
              the Platform after a change means you accept the new Policy.
            </Para>
          </>
        ),
      },
      {
        id: "information-we-collect",
        title: "Information We Collect",
        body: (
          <Bullets
            items={[
              <>
                <strong className="font-semibold text-[#1c1b22]">Account details</strong> — your full name, email, and
                password (stored hashed, never in plain text).
              </>,
              <>
                <strong className="font-semibold text-[#1c1b22]">Activity</strong> — sign-ins, sessions, and the
                documents you view or edit.
              </>,
              <>
                <strong className="font-semibold text-[#1c1b22]">HRMS attendance</strong> — only if an admin links your
                account.
              </>,
            ]}
          />
        ),
      },
      {
        id: "how-we-use-it",
        title: "How We Use It",
        body: (
          <Para>
            To run the Platform: sign you in, show your documents and usage, and keep your account secure. We never
            sell your data, and there are no advertising trackers on this site.
          </Para>
        ),
      },
      {
        id: "who-can-see-your-data",
        title: "Who Can See Your Data",
        body: (
          <Para>
            Admins can see the account details and activity needed to manage the team. Other users cannot see your
            attendance.
          </Para>
        ),
      },
      {
        id: "how-long-we-keep-it",
        title: "How Long We Keep It",
        body: (
          <Para>
            We keep your data while your account is active, and delete or anonymise it once it is no longer needed.
            Versions and the audit trail are kept for at least one year.
          </Para>
        ),
      },
      {
        id: "your-choices",
        title: "Your Choices",
        body: (
          <Para>
            You can update your name, change your notification settings, and sign out of other devices in Settings.
          </Para>
        ),
      },
      {
        id: "related-policies",
        title: "Related Policies",
        body: (
          <>
            <Para>The following policies also apply to your use of the Platform:</Para>
            <PolicyLinks
              items={[
                { label: "Terms of Service", href: "/terms" },
                { label: "Acceptable Use Guidelines", href: "/terms#acceptable-use" },
                { label: "Security Contacts", href: "/privacy#contact" },
              ]}
            />
            <Para>Each of these policies may change from time to time and applies from when it is posted.</Para>
          </>
        ),
      },
      {
        id: "contact",
        title: "Contact",
        body: <Para>Questions about this Policy? Contact the platform team at {CONTACT_EMAIL}.</Para>,
      },
    ],
  },
};
