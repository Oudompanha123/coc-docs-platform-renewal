import type { Tone } from "@/lib/mock/overview";

export const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  purple: { bg: "bg-[#efe9fc]", fg: "text-[#6d3ce0]" },
  green: { bg: "bg-[#e1f5ec]", fg: "text-[#1f9d6b]" },
  orange: { bg: "bg-[#fdece0]", fg: "text-[#e0873c]" },
  pink: { bg: "bg-[#fde7ef]", fg: "text-[#d94f7c]" },
};

/**
 * Solid gradient fills for initials avatars (profile chip, sidebar user card,
 * document rows) — distinct from TONE_STYLES's pastel icon tiles, which stay
 * pastel. Keyed by the same `tone` seed already on each data item, so a
 * given user/document keeps the same avatar color consistently.
 */
export const AVATAR_GRADIENTS: Record<Tone, string> = {
  purple: "bg-[linear-gradient(135deg,#6D3CE0,#4C6FF0)]",
  green: "bg-[linear-gradient(135deg,#20A163,#3EC98B)]",
  orange: "bg-[linear-gradient(135deg,#E8763F,#F0B429)]",
  pink: "bg-[linear-gradient(135deg,#4C6FF0,#6D3CE0)]",
};
