/**
 * The 3 content shapes actually in use across Jex3.0's real pages (Phase 1/3
 * audit) — a structured store needs to model these, not one raw-text blob.
 */

export type FeatureCardData = {
  icon: IconKey;
  /** An admin-uploaded image, shown instead of `icon` when present — the
   *  icon key is kept either way so removing the image falls back to a
   *  real choice rather than a blank tile. */
  imageUrl?: string;
  title: string;
  description: string;
};

export type HeroContent = {
  kind: "hero";
  /** "centered" (default, omitted for existing content) stacks the hero
   *  banner and the feature grid as today. "split" additionally shows a
   *  compact preview of the feature cards' icons/images beside the hero
   *  text — the same feature-card data, not a new field. */
  layout?: "centered" | "split";
  heading: string;
  tagline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  eyebrow: string;
  sectionHeading: string;
  sectionIntro: string;
  features: FeatureCardData[];
  /** Optional closing paragraph below the feature cards — for source content
   *  that had a trailing comparison/summary this content model has no
   *  dedicated shape for (e.g. a comparison table), reduced to prose rather
   *  than dropped. */
  closingNote?: string;
};

export type DownloadLink = {
  label: string;
  /** Same-origin path under `public/` (e.g. `/downloads/push-usage.mjs`) —
   *  never an external URL, so the `download` attribute reliably saves the
   *  file instead of the browser navigating to it. */
  href: string;
};

export type StepData = {
  title: string;
  body: string;
  command?: string;
  output?: string;
  /** Files a reader can grab for this step — rendered as buttons below the
   *  body text, above any command block. */
  downloads?: DownloadLink[];
};

export type StepsContent = {
  kind: "steps";
  eyebrow: string;
  heading: string;
  intro: string;
  calloutTone?: "info" | "warning";
  calloutText?: string;
  steps: StepData[];
};

export type SectionData = {
  title: string;
  note?: string;
  command?: string;
  exampleLabel?: string;
  exampleCommand?: string;
  /** Files a reader can grab for this section — same shape and rendering as
   *  {@link StepData.downloads}, added for sections that ship a helper script
   *  rather than just a copyable command. */
  downloads?: DownloadLink[];
};

export type SectionsContent = {
  kind: "sections";
  eyebrow: string;
  heading: string;
  intro: string;
  calloutText?: string;
  sections: SectionData[];
};

export type DocContent = HeroContent | StepsContent | SectionsContent;

/** Icon choices exposed to the admin editor — a closed set from this app's
 *  own icon library, not a free-text field. */
export const ICON_KEYS = ["sparkles", "layers", "shield", "pulse", "document", "coins", "tag", "question"] as const;
export type IconKey = (typeof ICON_KEYS)[number];
