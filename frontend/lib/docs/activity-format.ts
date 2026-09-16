import type { Tone } from "@/lib/mock/overview";
import type { ActivityEntry } from "./activity-api";

/** The three named states the reference design gives their own icon/color;
 *  everything else this endpoint can return renders with a neutral dot
 *  rather than inventing a fourth meaning that wasn't asked for. */
export type ActivityStatus = "signIn" | "signOut" | "roleChange" | "other";

export type ActivityLine = { description: string; status: ActivityStatus };

/** Turns `audit_log`'s machine vocabulary (`AuditAction` in the backend) into
 *  the single plain-language line the Recent Activity panel renders, plus
 *  which status icon it gets. Kept exhaustive over the actions this endpoint
 *  can actually return today rather than a generic fallback, since a
 *  silently-wrong fallback would be worse than a compile-time reminder to
 *  add the case when a new action is wired. */
export function formatActivityEntry(entry: ActivityEntry): ActivityLine {
  const d = entry.detail;

  switch (entry.action) {
    case "auth.sign_in":
      return { description: "Signed in successfully", status: "signIn" };
    case "auth.sign_out":
      return { description: "Signed out", status: "signOut" };
    case "account.role_change":
      return {
        description: `Changed a role for ${String(d.subject)}: ${String(d.from)} → ${String(d.to)}`,
        status: "roleChange",
      };
    case "docs_content.save":
      return { description: `Saved content for ${String(d.productKey)} → ${String(d.slug)}`, status: "other" };
    case "nav.product_create":
      return { description: `Added the "${String(d.label)}" product`, status: "other" };
    case "nav.product_delete":
      return { description: `Removed the "${String(d.key)}" product`, status: "other" };
    case "nav.item_create":
      return { description: `Added "${String(d.label)}" to ${String(d.productKey)}`, status: "other" };
    case "nav.item_delete":
      return { description: `Removed "${String(d.slug)}" from ${String(d.productKey)}`, status: "other" };
    case "account.create":
      return { description: `Created an account for ${String(d.subject)}`, status: "other" };
    case "account.deactivate":
      return { description: `Deactivated ${String(d.subject)}'s account`, status: "other" };
    case "account.reactivate":
      return { description: `Reactivated ${String(d.subject)}'s account`, status: "other" };
    case "account.delete":
      return { description: `Deleted ${String(d.subject)}'s account`, status: "other" };
    default:
      return { description: entry.action, status: "other" };
  }
}

const TONES: Tone[] = ["purple", "green", "orange", "pink"];

/** A consistent avatar color per actor — deterministic from the real email
 *  (a simple char-code hash), not random and not stored anywhere, so the
 *  same person always gets the same color without a new "user color" field. */
export function toneForEmail(email: string): Tone {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash + email.charCodeAt(i)) % TONES.length;
  return TONES[hash] ?? "purple";
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "2h ago", "3d ago", etc. Falls back to "just now" for anything under a minute. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  for (const [unit, secondsInUnit] of UNITS) {
    if (seconds >= secondsInUnit) {
      return rtf.format(-Math.floor(seconds / secondsInUnit), unit);
    }
  }
  return rtf.format(-Math.floor(seconds / 60), "minute");
}
