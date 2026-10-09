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
      /**
       * The Scan Logs page moved from `/claude-usage/logs` to
       * `/claude-usage/monitoring` (ADR-099 amendment). Kept so bookmarks and
       * links already shared keep landing on the page.
       */
      {
        source: "/claude-usage/logs",
        destination: "/claude-usage/monitoring",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
