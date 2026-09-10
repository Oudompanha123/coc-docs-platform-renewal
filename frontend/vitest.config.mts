import { defineConfig } from "vitest/config";

// Vitest resolves postcss.config.mjs when it loads its Vite config, even though
// no test imports CSS. On the Vite that vitest 2.1.8 bundled, the Tailwind v4
// plugin there was not a valid PostCSS plugin and config loading threw before
// any test ran. Next builds fine because it drives its own PostCSS pipeline;
// only the test runner saw this.
//
// Tests never render styles, so the pipeline is replaced rather than repaired.
//
// Kept after the move to vitest 4 / Vite 8, which no longer throws — but the
// suite is empty, so a clean run proves the config loads, not that the CSS
// pipeline works. Re-check when the first test that touches styles lands.
//
// The file is .mts so Vite's native config loader reads it as ESM; as .ts it
// warned about ESM syntax in a file loaded as CommonJS on every run.
export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
