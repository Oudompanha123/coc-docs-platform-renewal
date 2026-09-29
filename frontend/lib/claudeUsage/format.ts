/**
 * Display formatting for the personal "My Claude Usage" screen (ADR-058) —
 * chosen to read the way Claude Code's own usage page does, so the same
 * session shows the same figures in both places.
 *
 * // req: FR-USAGE-005, ADR-058
 */

/** The model name the backend uses for a day reported before per-model rows existed. */
export const UNATTRIBUTED_MODEL = "unattributed";

/** 16 → "16", 1_940 → "1.9K", 5_512_300 → "5.5M". One decimal, trailing ".0" dropped. */
export function formatTokens(n: number): string {
  const units: [number, string][] = [
    [1_000_000_000, "B"],
    [1_000_000, "M"],
    [1_000, "K"],
  ];
  for (const [size, suffix] of units) {
    if (Math.abs(n) >= size) {
      return `${(n / size).toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return String(Math.round(n));
}

/**
 * Two decimals above half a dollar, four below — Claude Code's own rule, so
 * a cheap Haiku day reads "$0.0020" rather than rounding away to "$0.00".
 */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(usd > 0.5 ? 2 : 4)}`;
}

/**
 * "claude-opus-5-5" → "Claude Opus 5.5", "claude-haiku-4-5-20251001" →
 * "Claude Haiku 4.5". Anything that does not look like a Claude model id is
 * shown as-is rather than guessed at.
 */
export function modelDisplayName(model: string): string {
  if (model === UNATTRIBUTED_MODEL) return "Unattributed";
  const match = /^claude-([a-z]+)((?:-\d+)+?)(?:-\d{8})?$/.exec(model);
  if (!match) return model;
  const family = match[1]!.charAt(0).toUpperCase() + match[1]!.slice(1);
  const version = match[2]!.slice(1).split("-").join(".");
  return `Claude ${family} ${version}`;
}

/** The model id without its date suffix — the chip beside the display name. */
export function modelShortId(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

/**
 * "+12% from previous 7 days" — or null when there is no previous spend to
 * compare against, since a percentage change from $0 means nothing.
 */
export function costChange(current: number, previous: number): { pct: number; up: boolean } | null {
  if (!(previous > 0)) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}
