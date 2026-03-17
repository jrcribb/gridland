import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"
import topLevelAwait from "vite-plugin-top-level-await"
import { gridlandWebPlugin } from "../../packages/web/src/vite-plugin"

export default defineConfig({
  plugins: [
    // gridland plugins must come first so aliases stub tree-sitter WASMs
    // before vite-plugin-wasm tries to process them
    ...gridlandWebPlugin(),
    wasm(),
    topLevelAwait(),
    react(),
  ],
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
})
