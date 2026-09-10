import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// `css: false` replaces the PostCSS workaround this file used to carry. Vitest
// resolves postcss.config.mjs when it loads its Vite config, and the Tailwind v4
// plugin there was not a valid PostCSS plugin for the bundled Vite — config
// loading threw before any test ran. Switching the pipeline off entirely is both
// simpler and faster than replacing its plugin list, and no test renders styles.
//
// The file is .mts so Vite's native config loader reads it as ESM. As .ts it
// warned about ESM syntax in a file loaded as CommonJS on every run.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's `"@/*": ["./*"]` path mapping.
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
