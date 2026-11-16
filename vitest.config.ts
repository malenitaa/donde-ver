import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
      // `server-only` throws outside a React Server Components build; tests
      // import server modules directly, so swap it for an empty module.
      "server-only": path.join(__dirname, "src/test/empty.ts"),
    },
  },
  test: {
    environment: "node",
  },
});
