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
  /** An optional second button beside the primary CTA — AX Renewal's docs,
   *  for one, link straight to the workspace itself. Absent for existing
   *  saved content. Renders only with both a label and a valid link: a
   *  same-site path ("/ax-renewal") or an https:// URL, the same rule the
   *  download buttons use. */
  secondaryCta?: HeroSecondaryCta;
  eyebrow: string;
  sectionHeading: string;
  sectionIntro: string;
  features: FeatureCardData[];
  /** Optional closing paragraph below the feature cards — for source content
   *  that had a trailing comparison/summary this content model has no
   *  dedicated shape for (e.g. a comparison table), reduced to prose rather
   *  than dropped. */
  closingNote?: string;
  /** Secondary "Download for ___" buttons shown beside the primary CTA, one
   *  URL per OS — absent entirely for existing saved content (never written
   *  by an older editor), so there is nothing here for old rows to break on.
   *  A button renders only when its own OS's URL is filled in. */
  downloadButtons?: HeroDownloadButtons;
};

export type HeroSecondaryCta = { label: string; href: string };

/** Whether a hero's second button is complete enough to show. */
export function isShownSecondaryCta(cta: HeroSecondaryCta | undefined): cta is HeroSecondaryCta {
  return cta != null && cta.label.trim() !== "" && cta.href !== "" && isValidHeroDownloadUrl(cta.href);
}

export type HeroDownloadOs = "windows" | "macos" | "linux";

/** Rendering order for the Hero's download buttons, and the editor's cards — Get started, then Windows, macOS, Linux. */
export const HERO_DOWNLOAD_OS_ORDER: HeroDownloadOs[] = ["windows", "macos", "linux"];

export const HERO_DOWNLOAD_OS_LABEL: Record<HeroDownloadOs, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

/**
 * One OS's download button, as the admin edits it: whether it's shown,
 * its own label/URL/version/size. Every field is optional — `resolveHeroDownloadButton`
 * is what turns a (possibly very sparse) one of these into the values a
 * caller actually renders with, defaults included.
 */
export type HeroDownloadButton = {
  /** Explicit show/hide, set the moment an admin clicks the toggle.
   *  Undefined means "no explicit choice yet" — resolved to "on exactly
   *  when a URL is already present", which is what makes old saved content
   *  (a bare URL string, next) behave exactly as it always did. */
  show?: boolean;
  label?: string;
  url?: string;
  /** Free text, e.g. "v2.1.0" — never parsed or compared, just displayed. */
  version?: string;
  /** Free text, e.g. "84 MB" — same as {@link version}. */
  size?: string;
};

/**
 * Each OS's settings. A plain URL string is the pre-upgrade shape — every
 * row saved by the first Download-buttons editor, before label/version/size/
 * show existed — kept forever as a valid alternative rather than migrated:
 * `docs_content.body` is schemaless JSON with no migration step of its own,
 * so an old row must keep meaning exactly what it always meant.
 */
export type HeroDownloadButtons = Partial<Record<HeroDownloadOs, HeroDownloadButton | string>>;

/** A {@link HeroDownloadButton} with every default already applied — what a renderer or the editor's own inputs actually read from. */
export type ResolvedHeroDownloadButton = {
  show: boolean;
  label: string;
  url: string;
  version: string;
  size: string;
};

/**
 * Resolves one OS's raw, possibly-sparse-or-legacy {@link HeroDownloadButtons}
 * entry into the values a caller renders with — the one place "old content
 * loads with no errors and shows the same buttons" (AC #8) and "empty label
 * falls back to Download for {OS}" (AC #4) both live, so the renderer and
 * the editor's own display can never disagree about either rule.
 */
export function resolveHeroDownloadButton(
  os: HeroDownloadOs,
  raw: HeroDownloadButton | string | undefined,
): ResolvedHeroDownloadButton {
  const entry: HeroDownloadButton = typeof raw === "string" ? { url: raw } : (raw ?? {});
  const url = entry.url ?? "";
  const label = entry.label?.trim();
  return {
    show: entry.show ?? url !== "",
    label: label ? label : `Download for ${HERO_DOWNLOAD_OS_LABEL[os]}`,
    url,
    version: entry.version ?? "",
    size: entry.size ?? "",
  };
}

/**
 * Whether a Hero download-button URL is safe to persist and render as a
 * link: exactly `https://` (a real, parseable one — not just the right
 * prefix) or a same-site relative path starting with a single `/`. Plain
 * `http://`, `javascript:`, `data:` and every other scheme are refused —
 * stricter than `lib/content/validate.ts`'s `isSafeHref`, which still allows
 * `http:`, because a binary download is a stronger target for a swapped
 * scheme than most links this app renders.
 *
 * <p>An empty string is valid too — it is this field's "no button" state —
 * so the editor can run this on every keystroke without special-casing
 * blank first.
 */
export function isValidHeroDownloadUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (!value.startsWith("https://")) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

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
