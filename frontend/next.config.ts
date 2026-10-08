import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Emit a self-contained server bundle in `.next/standalone` (infra/frontend.Dockerfile).
   *
   * <p>Without it the runtime image needs the whole `node_modules` tree —
   * hundreds of megabytes of build-only dependencies shipped to a server that
   * will never compile anything. With it the image carries the server, the
   * traced dependencies it actually imports, and nothing else.
   *
   * <p>No effect on `next dev` or on `next build` locally beyond the extra
   * output directory.
   */
  output: "standalone",

  /**
   * `/my-claude-usage` moved into `/account/settings`'s own Claude Usage
   * section (ADR-094) rather than staying its own page. A real HTTP 308
   * here (not a client-side `router.replace`) so the redirect is permanent
   * for crawlers/caches too, and so a query string — the CLI browser-login
   * flow's `?cli=signed-in` (ADR-060) — and the `#claude-usage` fragment
   * both survive: Next passes an unmatched incoming query string through to
   * the destination unchanged, and a fragment in `destination` is just
   * appended to the `Location` header, which the browser's own anchor-scroll
   * then honors once the page renders — no extra code needed either side.
   */
  async redirects() {
    return [
      {
        source: "/my-claude-usage",
        destination: "/account/settings#claude-usage",
        permanent: true,
      },
      {
        // The personal Attendance view moved into /account/settings's own
        // Attendance section, and the header's Reports & Records menu (which
        // held only it) went with it. Same permanent 308 as the line above,
        // so old links and bookmarks still land on it.
        source: "/reports/attendance",
        destination: "/account/settings#attendance",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
