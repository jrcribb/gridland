#!/usr/bin/env node
/**
 * Builds @gridland/bun:
 * - dist/index.js — Monolithic Bun-native ESM bundle.
 *
 * Bundles EVERYTHING (engine + reconciler + native FFI) in one file from
 * packages/core/ source. No engine code is externalized to @gridland/utils.
 * This prevents segfaults caused by bun:ffi pointers crossing npm package boundaries.
 *
 * react-reconciler is kept EXTERNAL (not bundled) because:
 * - Its production CJS build is missing getOwner() which React 19.2+ requires
 * - Its development CJS build works but calls console.timeStamp which fails in
 *   Bun's CJS context — fixed by the preload.js polyfill
 *
 * Shared state (AppContext, engine) uses globalThis singletons so that hooks
 * imported from @gridland/utils reference the same instances as the bundled engine.
 */
import * as esbuild from "esbuild"
import path from "path"
import { copyFileSync, readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const coreSrc = path.resolve(pkgRoot, "../core/src")

// require() shim for CJS packages (react-reconciler) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
].join(" ")

function createPlugin() {
  const webShimsDir = path.resolve(pkgRoot, "../web/src/shims")

  // Resolve react-reconciler's development CJS build and patch out console.timeStamp.
  // The dev build is needed (production build is missing getOwner() for React 19.2+).
  // But console.timeStamp is undefined in Bun's CJS context and crashes the reconciler.
  const _require = createRequire(path.resolve(pkgRoot, "package.json"))
  const reconcilerPkg = path.dirname(_require.resolve("react-reconciler/package.json"))
  const reconcilerRequire = createRequire(path.join(reconcilerPkg, "index.js"))
  const schedulerDir = path.dirname(reconcilerRequire.resolve("scheduler"))

  return {
    name: "bun-monolithic",
    setup(build) {
      // Bundle react-reconciler dev build with console.timeStamp patched to no-op
      build.onResolve({ filter: /^react-reconciler$/ }, () => ({
        path: path.join(reconcilerPkg, "cjs/react-reconciler.development.js"),
      }))
      build.onResolve({ filter: /^react-reconciler\/constants$/ }, () => ({
        path: path.join(reconcilerPkg, "cjs/react-reconciler-constants.development.js"),
      }))
      build.onLoad({ filter: /react-reconciler\.development\.js$/ }, (args) => {
        let src = readFileSync(args.path, "utf8")
        // Replace all console.timeStamp calls with no-ops
        src = src.replace(/console\.timeStamp/g, "(function(){})")
        return { contents: src, loader: "js" }
      })
      // Bundle scheduler's production build (no timeStamp issues there)
      build.onResolve({ filter: /^scheduler$/ }, () => ({
        path: path.join(schedulerDir, "cjs/scheduler.production.js"),
      }))

      // Stub devtools (optional peer dep)
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(webShimsDir, "devtools-polyfill-stub.ts"),
      }))

      // tree-sitter file assets (wasm/scm) — stub with null exports
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: "asset-stub",
        namespace: "bun-stub",
      }))
      build.onLoad({ filter: /asset-stub/, namespace: "bun-stub" }, () => ({
        contents: "export default null;",
        loader: "js",
      }))

      // Resolve package.json imports (used by host-config for rendererPackageName)
      build.onResolve({ filter: /package\.json$/ }, (args) => {
        if (args.resolveDir) {
          return { path: path.resolve(args.resolveDir, args.path) }
        }
        return null
      })

      // tree-sitter default-parsers.ts uses `with { type: "file" }` imports
      // that esbuild doesn't support. Stub the entire file.
      build.onResolve({ filter: /default-parsers/ }, (args) => {
        if (args.resolveDir?.includes("tree-sitter")) {
          return { path: "default-parsers-stub", namespace: "bun-stub" }
        }
        return null
      })
      build.onLoad({ filter: /default-parsers-stub/, namespace: "bun-stub" }, () => ({
        contents: "export const defaultParsers = []; export function getParsers() { return defaultParsers; }",
        loader: "js",
      }))
    },
  }
}

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "node",
    target: "esnext",
    sourcemap: true,
    treeShaking: true,
    loader: { ".json": "json" },
    external: [
      // React — peer dep, must be singleton
      "react", "react-dom",
      // scheduler — peer of react-reconciler, ships with react
      "scheduler",
      // Bun native FFI — resolved at runtime
      "bun:ffi",
      // Node builtins
      "events", "fs", "fs/promises", "path", "os", "stream", "url", "util", "crypto",
      "node:fs", "node:path", "node:os", "node:stream", "node:url",
      "node:util", "node:buffer", "node:console", "node:child_process",
      "node:net", "node:tty", "node:process", "node:events", "node:crypto",
      // tree-sitter (optional, loaded dynamically)
      "web-tree-sitter",
      // bun internals
      "bun",
      // WebSocket (devtools, optional)
      "ws",
    ],
    plugins: [createPlugin()],
    banner: { js: requireShimBanner },
  })

  // Copy hand-written DTS to dist
  copyFileSync(
    path.resolve(pkgRoot, "src/index.d.ts"),
    path.resolve(pkgRoot, "dist/index.d.ts"),
  )

  console.log("@gridland/bun dist/index.js built")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
