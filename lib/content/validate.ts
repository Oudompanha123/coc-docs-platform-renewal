/**
 * Coc Docs Platform — runtime validation of page bodies.
 *
 * Sprint 1 / T5. A body that does not conform is rejected at the API boundary,
 * not discovered at render time.
 *
 * This is a security control as much as a correctness one. Combined with the
 * absence of a raw-html block type (ADR-010 §3), it means there is no path by
 * which an editor can persist markup that the renderer would execute.
 *
 * Hand-written rather than schema-library based: zero new dependencies, and the
 * error messages can name the offending block in terms an editor understands.
 *
 * // req: FR-CONT-009, NFR-SEC-SANITIZE, ADR-011
 */

import {
  BLOCK_TYPES,
  EMBEDDABLE_COMPONENTS,
  type Block,
  type BlockType,
  type EmbeddableComponent,
  type InlineMark,
  type LinkTarget,
  type PageBody,
  type RichText,
} from './blocks';

/** Bounds a hostile or accidental deep structure. */
export const MAX_NESTING_DEPTH = 3;
/** Bounds payload size independently of the HTTP body limit. */
export const MAX_BLOCKS_PER_PAGE = 500;
export const MAX_TEXT_LENGTH = 20_000;

const INLINE_MARKS: InlineMark[] = ['bold', 'italic', 'code'];

export type ValidationIssue = {
  /** Dotted path to the offending node, e.g. "body[3].items[1].title". */
  path: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; body: PageBody }
  | { ok: false; issues: ValidationIssue[] };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Only http(s) and same-site relative links are permitted.
 * Blocks javascript:, data:, vbscript: and similar schemes at the point of
 * persistence rather than relying on the renderer to escape them.
 */
function isSafeHref(href: string): boolean {
  if (href.startsWith('/') && !href.startsWith('//')) return true;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateLink(link: unknown, path: string, issues: ValidationIssue[]): void {
  if (!isPlainObject(link)) {
    issues.push({ path, message: 'link must be an object' });
    return;
  }
  const hasPageId = typeof link.pageId === 'string' && link.pageId.length > 0;
  const hasHref = typeof link.href === 'string';

  if (hasPageId === hasHref) {
    issues.push({ path, message: 'link must have exactly one of pageId or href' });
    return;
  }
  if (hasHref && !isSafeHref(link.href as string)) {
    issues.push({
      path: `${path}.href`,
      message: 'link must be a relative path or an http(s) URL',
    });
  }
}

function validateRichText(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'expected rich text (an array of inline nodes)' });
    return;
  }
  value.forEach((node, i) => {
    const p = `${path}[${i}]`;
    if (!isPlainObject(node)) {
      issues.push({ path: p, message: 'inline node must be an object' });
      return;
    }
    if (typeof node.text !== 'string') {
      issues.push({ path: `${p}.text`, message: 'inline node requires a text string' });
    } else if (node.text.length > MAX_TEXT_LENGTH) {
      issues.push({ path: `${p}.text`, message: `text exceeds ${MAX_TEXT_LENGTH} characters` });
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks)) {
        issues.push({ path: `${p}.marks`, message: 'marks must be an array' });
      } else {
        node.marks.forEach((m: unknown, j: number) => {
          if (!INLINE_MARKS.includes(m as InlineMark)) {
            issues.push({
              path: `${p}.marks[${j}]`,
              message: `unknown mark; expected one of ${INLINE_MARKS.join(', ')}`,
            });
          }
        });
      }
    }
    if (node.link !== undefined) validateLink(node.link, `${p}.link`, issues);
  });
}

function validateBlock(
  block: unknown,
  path: string,
  depth: number,
  issues: ValidationIssue[],
): void {
  if (!isPlainObject(block)) {
    issues.push({ path, message: 'block must be an object' });
    return;
  }
  const type = block.type;
  if (typeof type !== 'string' || !BLOCK_TYPES.includes(type as BlockType)) {
    issues.push({
      path: `${path}.type`,
      message: `unknown block type${typeof type === 'string' ? ` "${type}"` : ''}; the vocabulary is ${BLOCK_TYPES.join(', ')}`,
    });
    return;
  }

  switch (type as BlockType) {
    case 'heading': {
      if (block.level !== 2 && block.level !== 3) {
        issues.push({ path: `${path}.level`, message: 'heading level must be 2 or 3' });
      }
      validateRichText(block.text, `${path}.text`, issues);
      break;
    }

    case 'paragraph':
      validateRichText(block.text, `${path}.text`, issues);
      break;

    case 'list': {
      if (typeof block.ordered !== 'boolean') {
        issues.push({ path: `${path}.ordered`, message: 'ordered must be a boolean' });
      }
      if (!Array.isArray(block.items)) {
        issues.push({ path: `${path}.items`, message: 'items must be an array' });
      } else {
        block.items.forEach((it, i) => validateRichText(it, `${path}.items[${i}]`, issues));
      }
      break;
    }

    case 'table': {
      if (!Array.isArray(block.headers)) {
        issues.push({ path: `${path}.headers`, message: 'headers must be an array' });
      } else {
        block.headers.forEach((h, i) => validateRichText(h, `${path}.headers[${i}]`, issues));
      }
      if (!Array.isArray(block.rows)) {
        issues.push({ path: `${path}.rows`, message: 'rows must be an array' });
        break;
      }
      const width = Array.isArray(block.headers) ? block.headers.length : -1;
      block.rows.forEach((row, r) => {
        if (!Array.isArray(row)) {
          issues.push({ path: `${path}.rows[${r}]`, message: 'row must be an array of cells' });
          return;
        }
        // Ragged tables render unpredictably; reject at the boundary instead.
        if (width >= 0 && row.length !== width) {
          issues.push({
            path: `${path}.rows[${r}]`,
            message: `row has ${row.length} cells but the table has ${width} columns`,
          });
        }
        row.forEach((cell, c) => validateRichText(cell, `${path}.rows[${r}][${c}]`, issues));
      });
      break;
    }

    case 'code': {
      if (typeof block.language !== 'string') {
        issues.push({ path: `${path}.language`, message: 'language must be a string' });
      }
      if (typeof block.source !== 'string') {
        issues.push({ path: `${path}.source`, message: 'source must be a string' });
      } else if (block.source.length > MAX_TEXT_LENGTH) {
        issues.push({ path: `${path}.source`, message: `source exceeds ${MAX_TEXT_LENGTH} characters` });
      }
      if (typeof block.copyable !== 'boolean') {
        issues.push({ path: `${path}.copyable`, message: 'copyable must be a boolean' });
      }
      if (block.command !== undefined && typeof block.command !== 'string') {
        issues.push({ path: `${path}.command`, message: 'command must be a string when present' });
      }
      break;
    }

    case 'callout': {
      if (block.variant !== 'note' && block.variant !== 'important') {
        issues.push({ path: `${path}.variant`, message: 'variant must be note or important' });
      }
      validateNested(block.body, `${path}.body`, depth, issues);
      break;
    }

    case 'steps': {
      if (!Array.isArray(block.items)) {
        issues.push({ path: `${path}.items`, message: 'items must be an array' });
        break;
      }
      block.items.forEach((item, i) => {
        const p = `${path}.items[${i}]`;
        if (!isPlainObject(item)) {
          issues.push({ path: p, message: 'step must be an object' });
          return;
        }
        validateRichText(item.title, `${p}.title`, issues);
        validateNested(item.body, `${p}.body`, depth, issues);
      });
      break;
    }

    case 'cards': {
      if (!Array.isArray(block.items)) {
        issues.push({ path: `${path}.items`, message: 'items must be an array' });
        break;
      }
      block.items.forEach((item, i) => {
        const p = `${path}.items[${i}]`;
        if (!isPlainObject(item)) {
          issues.push({ path: p, message: 'card must be an object' });
          return;
        }
        if (item.icon !== undefined && typeof item.icon !== 'string') {
          issues.push({ path: `${p}.icon`, message: 'icon must be a string when present' });
        }
        validateRichText(item.title, `${p}.title`, issues);
        validateRichText(item.body, `${p}.body`, issues);
        if (item.link !== undefined) validateLink(item.link, `${p}.link`, issues);
      });
      break;
    }

    case 'image': {
      if (typeof block.assetId !== 'string' || block.assetId.length === 0) {
        issues.push({ path: `${path}.assetId`, message: 'assetId is required' });
      }
      // Empty alt is legal (decorative images); a missing alt field is not.
      if (typeof block.alt !== 'string') {
        issues.push({ path: `${path}.alt`, message: 'alt text is required (use "" for decorative images)' });
      }
      if (block.caption !== undefined) {
        validateRichText(block.caption, `${path}.caption`, issues);
      }
      break;
    }

    case 'embed': {
      if (!EMBEDDABLE_COMPONENTS.includes(block.component as EmbeddableComponent)) {
        issues.push({
          path: `${path}.component`,
          message: `unknown component; the registry contains ${EMBEDDABLE_COMPONENTS.join(', ')}`,
        });
      }
      if (block.props !== undefined && !isPlainObject(block.props)) {
        issues.push({ path: `${path}.props`, message: 'props must be an object' });
      }
      break;
    }
  }
}

function validateNested(
  value: unknown,
  path: string,
  depth: number,
  issues: ValidationIssue[],
): void {
  if (depth >= MAX_NESTING_DEPTH) {
    issues.push({ path, message: `nesting exceeds the maximum depth of ${MAX_NESTING_DEPTH}` });
    return;
  }
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'expected an array of blocks' });
    return;
  }
  value.forEach((b, i) => validateBlock(b, `${path}[${i}]`, depth + 1, issues));
}

/**
 * Validates a page body. Call this on every write path before persisting.
 *
 * Returns the body narrowed to `PageBody` on success, so callers cannot
 * accidentally persist an unvalidated value.
 */
export function validatePageBody(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(value)) {
    return { ok: false, issues: [{ path: 'body', message: 'body must be an array of blocks' }] };
  }
  if (value.length > MAX_BLOCKS_PER_PAGE) {
    issues.push({
      path: 'body',
      message: `page has ${value.length} blocks; the maximum is ${MAX_BLOCKS_PER_PAGE}`,
    });
  }

  value.forEach((block, i) => validateBlock(block, `body[${i}]`, 0, issues));

  return issues.length === 0
    ? { ok: true, body: value as PageBody }
    : { ok: false, issues };
}

/** Collects every page reference in a body — used to find links to a deleted page. */
export function collectPageRefs(body: PageBody): string[] {
  const refs = new Set<string>();

  const fromRich = (rt: RichText) => {
    for (const node of rt) {
      const link = (node as { link?: LinkTarget }).link;
      if (link && 'pageId' in link && link.pageId) refs.add(link.pageId);
    }
  };

  const walk = (blocks: Block[]) => {
    for (const b of blocks) {
      switch (b.type) {
        case 'heading':
        case 'paragraph':
          fromRich(b.text);
          break;
        case 'list':
          b.items.forEach(fromRich);
          break;
        case 'table':
          b.headers.forEach(fromRich);
          b.rows.forEach((r) => r.forEach(fromRich));
          break;
        case 'callout':
          walk(b.body);
          break;
        case 'steps':
          b.items.forEach((s) => {
            fromRich(s.title);
            walk(s.body);
          });
          break;
        case 'cards':
          b.items.forEach((c) => {
            fromRich(c.title);
            fromRich(c.body);
            if (c.link && 'pageId' in c.link && c.link.pageId) refs.add(c.link.pageId);
          });
          break;
        default:
          break;
      }
    }
  };

  walk(body);
  return [...refs];
}
