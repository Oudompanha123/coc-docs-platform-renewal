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
};

export default nextConfig;
