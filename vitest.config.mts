import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "node",
    dir: "./src/tests",
    exclude: [".next/", "node_modules/", "src/generated/", "src/generated-v2/"],
  },
})
