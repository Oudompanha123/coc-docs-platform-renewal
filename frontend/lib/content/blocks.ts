/**
 * Coc Docs Platform — content block model.
 *
 * Sprint 1 / T5. Implements docs/design/adr/ADR-010-content-model.md.
 *
 * A page body is an ordered array of typed blocks. Ten types, reduced from the
 * 32 CSS-class structures the .tsx content uses today (CONST-TECH-04) — every
 * block type costs both an editing UI and a renderer, and one part-time
 * developer cannot afford 32 of each.
 *
 * There is deliberately NO raw-html block. Today `dangerouslySetInnerHTML` is
 * tolerable because one trusted person authors it for an authenticated
 * audience; both halves of that end. Without a field where markup is legal,
 * stored XSS is prevented structurally rather than by filtering.
 *
 * // req: FR-CONT-009, CONST-TECH-03, CONST-TECH-04, NFR-SEC-SANITIZE
 */

/** Locales, mirroring lib/i18n.ts. English is the reference language. */
export type Locale = 'en' | 'km' | 'ko';

/**
 * A link target stored as a page reference, never a literal URL.
 * Renaming a slug therefore cannot break an internal link, and finding
 * references to a deleted page is a lookup rather than a text search.
 * // req: FR-READ-003, FR-CONT-007
 */
export type PageRef = {
  pageId: string;
  /** Optional external URL — used only when pageId is absent. */
  href?: never;
};

export type ExternalRef = {
  pageId?: never;
  href: string;
};

export type LinkTarget = PageRef | ExternalRef;

/** Inline formatting. Intentionally minimal — the marks the content actually uses. */
export type InlineMark = 'bold' | 'italic' | 'code';

export type InlineNode =
  | { text: string; marks?: InlineMark[] }
  | { text: string; marks?: InlineMark[]; link: LinkTarget };

/** A run of inline nodes. Never a raw HTML string. */
export type RichText = InlineNode[];

/** Components an `embed` block may reference. Closed set, resolved server-side. */
export const EMBEDDABLE_COMPONENTS = ['HarnessDemo', 'OwnerTree'] as const;
export type EmbeddableComponent = (typeof EMBEDDABLE_COMPONENTS)[number];

// ---------------------------------------------------------------------------
// The ten block types
// ---------------------------------------------------------------------------

export type HeadingBlock = { type: 'heading'; level: 2 | 3; text: RichText };
export type ParagraphBlock = { type: 'paragraph'; text: RichText };
export type ListBlock = { type: 'list'; ordered: boolean; items: RichText[] };

export type TableBlock = {
  type: 'table';
  headers: RichText[];
  rows: RichText[][];
};

/**
 * `copyable` carries behaviour, not styling: the reader-side copy button
 * (PageFx) attaches to these. 183 such blocks exist in the current content, so
 * "copyable code" must survive migration as a distinct type rather than
 * collapsing into generic preformatted text.
 * // req: FR-CONT-011, BR-010
 */
export type CodeBlock = {
  type: 'code';
  language: string;
  source: string;
  copyable: boolean;
  /** Overrides the copied text when it differs from what is displayed. */
  command?: string;
};

export type CalloutBlock = {
  type: 'callout';
  variant: 'note' | 'important';
  body: Block[];
};

export type StepsBlock = {
  type: 'steps';
  items: { title: RichText; body: Block[] }[];
};

export type CardsBlock = {
  type: 'cards';
  items: {
    icon?: string;
    title: RichText;
    body: RichText;
    link?: LinkTarget;
  }[];
};

export type ImageBlock = {
  type: 'image';
  assetId: string;
  alt: string;
  caption?: RichText;
};

/**
 * References a component from the closed registry above and supplies props.
 * An editor may place a component; an editor may not define, modify or add one
 * — that stays a developer task and a code change. This keeps Tier B content
 * working without turning the CMS into an arbitrary code-execution surface.
 * // req: FR-CONT-010, ADR-010 §4
 */
export type EmbedBlock = {
  type: 'embed';
  component: EmbeddableComponent;
  props: Record<string, unknown>;
};

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | CodeBlock
  | CalloutBlock
  | StepsBlock
  | CardsBlock
  | ImageBlock
  | EmbedBlock;

export type PageBody = Block[];

export const BLOCK_TYPES = [
  'heading',
  'paragraph',
  'list',
  'table',
  'code',
  'callout',
  'steps',
  'cards',
  'image',
  'embed',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/**
 * Blocks that may nest other blocks. Nesting is bounded (see MAX_NESTING_DEPTH
 * in validate.ts) so that a hostile or accidental deep structure cannot be used
 * to exhaust the renderer.
 */
export const NESTING_BLOCKS: BlockType[] = ['callout', 'steps'];
