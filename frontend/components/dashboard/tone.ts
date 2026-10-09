import type { Tone } from "@/lib/mock/overview";

/**
 * Icon-tile tints (ADR-104 r2.0). The pastel set here was the brand's —
 * lilac, mint, peach, rose — and it is what made a dashboard read as the old
 * design however neutral the controls on it became.
 *
 * `purple` is the default tone and by far the most used, so it goes fully
 * neutral. The other three keep a tint but a quieter, desaturated one: they
 * are category markers (a green tile means something different from an orange
 * one) and flattening all four to grey would delete information rather than
 * restyle it.
 *
 * Each tone carries its dark value too (ADR-104 r2.5): on a #171717 card the
 * light pastels read as small bright squares. Dark keeps the same hue as a
 * low-alpha tint with a lighter glyph, the way shadcn's dark badges do it.
 */
export const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  purple: { bg: "bg-[#f5f5f5] dark:bg-[#262626]", fg: "text-[#171717] dark:text-[#fafafa]" },
  green: { bg: "bg-[#ecf6f1] dark:bg-[#2f7d5d]/20", fg: "text-[#2f7d5d] dark:text-[#6cc79f]" },
  orange: { bg: "bg-[#f8f0e9] dark:bg-[#9a6b3c]/20", fg: "text-[#9a6b3c] dark:text-[#d9a874]" },
  pink: { bg: "bg-[#f7eef1] dark:bg-[#9a4f68]/20", fg: "text-[#9a4f68] dark:text-[#d98aa3]" },
};

/**
 * Solid gradient fills for initials avatars (profile chip, sidebar user card,
 * document rows) — distinct from TONE_STYLES's pastel icon tiles, which stay
 * pastel. Keyed by the same `tone` seed already on each data item, so a
 * given user/document keeps the same avatar color consistently.
 */
export const AVATAR_GRADIENTS: Record<Tone, string> = {
  purple: "bg-[linear-gradient(135deg,#262626,#525252)]",
  green: "bg-[linear-gradient(135deg,#2F7D5D,#4F9E7E)]",
  orange: "bg-[linear-gradient(135deg,#9A6B3C,#BE9460)]",
  pink: "bg-[linear-gradient(135deg,#9A4F68,#BE7A8F)]",
};
