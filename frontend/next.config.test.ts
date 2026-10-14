import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

/**
 * The actual redirect behavior (a real 308, query string and fragment both
 * preserved) is verified by hand against a running server — Vitest can't
 * drive Next's own routing layer. This instead pins the one thing a typo or
 * an accidental deletion here would silently break: the redirect rule
 * `next.config.ts` hands back to Next.js (ADR-094).
 */
describe("next.config.ts redirects", () => {
  it("permanently redirects /my-claude-usage to the Claude Usage section on /account/settings", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/my-claude-usage",
      destination: "/account/settings#claude-usage",
      permanent: true,
    });
  });

  it("permanently redirects /reports/attendance to the Attendance section on /account/settings", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/reports/attendance",
      destination: "/account/settings#attendance",
      permanent: true,
    });
  });

  it("permanently redirects the old /claude-usage/logs URL to /claude-usage/monitoring", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/claude-usage/logs",
      destination: "/claude-usage/monitoring",
      permanent: true,
    });
  });
});
