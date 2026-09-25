import { redirect } from "next/navigation";

/**
 * `/my-claude-usage` no longer exists as its own page — the personal
 * dashboard it once held now lives as a section embedded directly on
 * `/home` instead (ADR-047, further revised). A top-level route, not under
 * `(shell)`, precisely so it needs no session gate at all: it never renders
 * anything of its own, so there is nothing here for `RequireSession`'s
 * admin-only floor to protect against — every caller, signed in or not, is
 * simply sent on to `/home` (which applies its own gate,
 * `RequireMemberSession`, once they land there).
 */
export default function MyClaudeUsageRedirect() {
  redirect("/home#my-claude-usage");
}
