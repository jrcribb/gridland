import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  // DTS is hand-written (src/index.d.ts) and copied in package.json build script.
  // Auto-generation fails because the core source chain references Bun types,
  // native EventEmitter, and custom JSX intrinsics.
  dts: false,
  target: "esnext",
  platform: "neutral",
})
