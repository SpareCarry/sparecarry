import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup-supabase-mock.ts"],
    // Exclude Playwright E2E tests (they use .spec.ts, unit/integration use .test.ts)
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/*.spec.ts", // Exclude Playwright tests (they use .spec.ts)
      "**/playwright.config.*",
    ],
    // Only include .test.ts files - Playwright uses .spec.ts
    include: ["**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
