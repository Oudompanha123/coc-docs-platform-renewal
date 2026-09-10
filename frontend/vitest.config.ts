import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's `"@/*": ["./*"]` path mapping.
      "@": path.resolve(__dirname, "."),
    },
  },
});
