/**
 * The 3 content shapes actually in use across Jex3.0's real pages (Phase 1/3
 * audit) — a structured store needs to model these, not one raw-text blob.
 */

export type FeatureCardData = {
  icon: IconKey;
  title: string;
  description: string;
};

export type HeroContent = {
  kind: "hero";
  heading: string;
  tagline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  eyebrow: string;
  sectionHeading: string;
  sectionIntro: string;
  features: FeatureCardData[];
};

export type StepData = {
  title: string;
  body: string;
  command?: string;
  output?: string;
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
