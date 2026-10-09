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
 */
export const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  purple: { bg: "bg-[#f5f5f5]", fg: "text-[#171717]" },
  green: { bg: "bg-[#ecf6f1]", fg: "text-[#2f7d5d]" },
  orange: { bg: "bg-[#f8f0e9]", fg: "text-[#9a6b3c]" },
  pink: { bg: "bg-[#f7eef1]", fg: "text-[#9a4f68]" },
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
