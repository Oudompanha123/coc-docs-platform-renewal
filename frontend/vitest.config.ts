import { defineConfig } from "vitest/config";

// Vitest resolves postcss.config.mjs when it loads its Vite config, even though
// no test imports CSS. The Tailwind v4 plugin there is not a valid PostCSS
// plugin for the Vite version vitest 2.1.8 bundles, so config loading throws
// before any test runs. Next builds fine because it drives its own PostCSS
// pipeline; only the test runner sees this.
//
// Tests never render styles, so the pipeline is replaced rather than repaired.
export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
