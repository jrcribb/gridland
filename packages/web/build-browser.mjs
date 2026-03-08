#!/usr/bin/env node
/**
 * Builds the browser entries (index, next) using esbuild directly.
 * tsup's internal plugins intercept bun:ffi and node built-in imports
 * before user plugins can shim them, so we bypass tsup for these entries.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))

const shims = {
  "bun:ffi": path.resolve(pkgRoot, "src/shims/bun-ffi.ts"),
  "bun-ffi-structs": path.resolve(pkgRoot, "src/shims/bun-ffi-structs.ts"),
  bun: path.resolve(pkgRoot, "src/shims/bun-ffi.ts"),
  "node:console": path.resolve(pkgRoot, "src/shims/console.ts"),
  events: path.resolve(pkgRoot, "src/shims/events-shim.ts"),
  "node:buffer": path.resolve(pkgRoot, "src/shims/node-buffer.ts"),
  "node:path": path.resolve(pkgRoot, "src/shims/node-path.ts"),
  path: path.resolve(pkgRoot, "src/shims/node-path.ts"),
  "node:fs": path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  fs: path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  "fs/promises": path.resolve(pkgRoot, "src/shims/node-fs.ts"),
  "node:util": path.resolve(pkgRoot, "src/shims/node-util.ts"),
  util: path.resolve(pkgRoot, "src/shims/node-util.ts"),
  os: path.resolve(pkgRoot, "src/shims/node-os.ts"),
  "node:os": path.resolve(pkgRoot, "src/shims/node-os.ts"),
  stream: path.resolve(pkgRoot, "src/shims/node-stream.ts"),
  "node:stream": path.resolve(pkgRoot, "src/shims/node-stream.ts"),
  url: path.resolve(pkgRoot, "src/shims/node-url.ts"),
  "node:url": path.resolve(pkgRoot, "src/shims/node-url.ts"),
}

const shimPlugin = {
  name: "browser-shims",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (shims[args.path]) return { path: shims[args.path] }
      return undefined
    })
    build.onResolve({ filter: /tree-sitter/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts"),
    }))
    build.onResolve({ filter: /hast-styled-text/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/hast-stub.ts"),
    }))
    build.onResolve({ filter: /devtools-polyfill/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts"),
    }))
    build.onResolve({ filter: /react-devtools-core/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/devtools-polyfill-stub.ts"),
    }))
    build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
      path: path.resolve(pkgRoot, "src/shims/tree-sitter-stub.ts"),
    }))
  },
}

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "esnext",
  mainFields: ["module", "browser", "main"],
  conditions: ["import", "browser"],
  external: ["react", "react-dom"],
  plugins: [shimPlugin],
  sourcemap: true,
  outdir: path.resolve(pkgRoot, "dist"),
}

async function main() {
  // Build index (main browser bundle)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    outdir: undefined,
  })
  console.log("✓ dist/index.js")

  // Build next (browser bundle with "use client" banner)
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/next.ts")],
    outfile: path.resolve(pkgRoot, "dist/next.js"),
    outdir: undefined,
    banner: { js: '"use client";' },
  })
  console.log("✓ dist/next.js")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
