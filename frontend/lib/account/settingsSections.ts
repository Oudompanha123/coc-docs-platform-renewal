/**
 * Canonical list/order of `/account/settings`'s tab sections, shared between
 * the page (hash resolution, tabpanel assembly) and `SettingsSideMenu` (the
 * tablist), so the two can't drift apart on ids or ordering.
 *
 * // req: ADR-094
 */
export type SettingsSectionId =
  | "account"
  | "appearance"
  | "notifications"
  | "claude-usage"
  | "attendance"
  | "connected-accounts"
  | "security"
  | "password-2fa"
  | "sessions";

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "account";

const BEFORE_CLAUDE_USAGE: SettingsSectionId[] = ["account", "appearance", "notifications"];
// Attendance sits right under Claude Usage; it moved here from the former
// /reports/attendance page and is visible to every role, as that page was.
// Password & 2FA has its own tab between Security and Sessions.
const AFTER_CLAUDE_USAGE: SettingsSectionId[] = [
  "attendance",
  "connected-accounts",
  "security",
  "password-2fa",
  "sessions",
];

/** Same `user`/`admin`/`super_admin` floor `/my-claude-usage` always had (ADR-094). */
export function getVisibleSettingsSections(canSeeClaudeUsage: boolean): SettingsSectionId[] {
  return canSeeClaudeUsage
    ? [...BEFORE_CLAUDE_USAGE, "claude-usage", ...AFTER_CLAUDE_USAGE]
    : [...BEFORE_CLAUDE_USAGE, ...AFTER_CLAUDE_USAGE];
}

/**
 * Resolves an incoming `location.hash` to a visible section id — rewriting
 * the pre-ADR-094 `#profile` id to `#account`, and falling back to the
 * default for an empty, unknown, or (for the current role) hidden hash.
 */
export function resolveSettingsSectionFromHash(
  hash: string,
  visible: readonly SettingsSectionId[],
): SettingsSectionId {
  const raw = hash.replace(/^#/, "");
  const id = raw === "profile" ? "account" : raw;
  return (visible as readonly string[]).includes(id) ? (id as SettingsSectionId) : DEFAULT_SETTINGS_SECTION;
}
