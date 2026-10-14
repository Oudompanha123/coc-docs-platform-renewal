import type { MdColor } from "./markdown";

/**
 * The one place a legal page's text tone becomes a colour (ADR-114).
 *
 * Both the editor's `textColor` mark and the public `MarkdownView` render
 * through this map, so a coloured clause looks identical while being written
 * and after it publishes — which is the whole promise of this editor.
 *
 * They are utility classes rather than inline colours on purpose: the admin
 * shell lifts `.text-danger`, `.text-success` and `.text-caution` for dark
 * mode in `globals.css`, and an inline `style` would keep the light-mode value
 * on a dark ground. Written out in full because Tailwind does not see
 * interpolated class names.
 */
export const LEGAL_COLOR_CLASS: Record<MdColor, string> = {
  muted: "text-muted-foreground",
  positive: "text-success",
  caution: "text-caution",
  critical: "text-danger",
};
