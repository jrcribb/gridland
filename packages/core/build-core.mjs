#!/usr/bin/env node
/**
 * Builds @gridland/core:
 * - dist/index.js  — Bun bundle: @opentui/core + @opentui/core/native + @opentui/react
 * - dist/browser.js — Browser bundle: @opentui/core (browser-safe) + @opentui/react
 *
 * The "bun" export condition in package.json resolves to dist/index.js.
 * The "import" condition (used by browser bundlers) resolves to dist/browser.js.
 */
import * as esbuild from "esbuild"
import path from "path"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const opentuiRoot = path.resolve(pkgRoot, "../../opentui/packages")

// require() shim for CJS packages (react-reconciler) in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
  `if (typeof process === "undefined") var process = { env: {} };`,
].join(" ")

// Browser file-level shims: replace native-backed opentui classes with browser implementations.
// Must match the shims in @gridland/web's vite-plugin.
const webRoot = path.resolve(pkgRoot, "../web")
const browserFileShims = {
  "buffer": path.resolve(webRoot, "src/browser-buffer.ts"),
  "text-buffer": path.resolve(webRoot, "src/shims/text-buffer-shim.ts"),
  "text-buffer-view": path.resolve(webRoot, "src/shims/text-buffer-view-shim.ts"),
  "syntax-style": path.resolve(webRoot, "src/shims/syntax-style-shim.ts"),
  "edit-buffer": path.resolve(webRoot, "src/shims/edit-buffer-stub.ts"),
  "editor-view": path.resolve(webRoot, "src/shims/editor-view-stub.ts"),
  "post/filters": path.resolve(webRoot, "src/shims/filters-stub.ts"),
  "animation/Timeline": path.resolve(webRoot, "src/shims/timeline-stub.ts"),
}
const resolvedBrowserShims = new Map()
for (const [key, shimPath] of Object.entries(browserFileShims)) {
  resolvedBrowserShims.set(path.resolve(opentuiRoot, "core/src", key + ".ts"), shimPath)
}

// Shared stubs for both builds
function createBasePlugin({ stubNative = false } = {}) {
  return {
    name: "resolve-opentui",
    setup(build) {
      build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
        path: path.resolve(opentuiRoot, "core/src/index.ts"),
      }))
      if (stubNative) {
        // Browser build: stub @opentui/core/native (CliRenderer, NativeSpanFeed, etc. not needed)
        build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
          path: "opentui-core-native-stub",
          namespace: "stub",
        }))
        build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: "export const CliRenderer = null; export const CliRenderEvents = null; export const createCliRenderer = null; export const NativeSpanFeed = null; export const setRenderLibPath = () => {};",
          loader: "js",
        }))
        // Browser build: redirect native-backed opentui files to browser shims
        build.onResolve({ filter: /.*/ }, (args) => {
          if (!args.resolveDir || !args.path.startsWith(".")) return null
          const resolved = path.resolve(args.resolveDir, args.path)
          // Check with and without .ts extension
          for (const candidate of [resolved, resolved + ".ts"]) {
            const shim = resolvedBrowserShims.get(candidate)
            if (shim) return { path: shim }
          }
          return null
        })
      } else {
        build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
          path: path.resolve(opentuiRoot, "core/src/native.ts"),
        }))
      }
      build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
        path: path.resolve(opentuiRoot, "react/src/index.ts"),
      }))
      // Stub bun-ffi-structs (not available outside Bun's native FFI)
      build.onResolve({ filter: /bun-ffi-structs/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/bun-ffi-structs.ts"),
      }))
      // Stub tree-sitter (uses `import with { type: "file" }` which esbuild
      // can't handle). Tree-sitter is for syntax highlighting, not core rendering.
      build.onResolve({ filter: /tree-sitter/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/tree-sitter-stub.ts"),
      }))
      build.onResolve({ filter: /hast-styled-text/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/hast-stub.ts"),
      }))
      build.onResolve({ filter: /\.(wasm|scm)$/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/tree-sitter-stub.ts"),
      }))
      // Stub devtools polyfill (uses top-level await for ws import)
      build.onResolve({ filter: /devtools-polyfill/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/devtools-polyfill-stub.ts"),
      }))
      build.onResolve({ filter: /react-devtools-core/ }, () => ({
        path: path.resolve(pkgRoot, "../web/src/shims/devtools-polyfill-stub.ts"),
      }))
    },
  }
}

const sharedExternal = [
  "react", "react-dom",
  "bun:ffi", "bun",
  "events",
  "fs", "fs/promises", "path", "os", "stream", "url", "util",
  "node:fs", "node:path", "node:os", "node:stream", "node:url",
  "node:util", "node:buffer", "node:console", "node:child_process",
  "node:net", "node:tty", "node:process", "node:events",
  "tree-sitter-styled-text", "web-tree-sitter", "hast-styled-text",
  "ws",
]

async function main() {
  const shared = { bundle: true, format: "esm", platform: "neutral", target: "esnext", external: sharedExternal, sourcemap: true, banner: { js: requireShimBanner } }

  // Bun bundle: single file, no splitting needed (Bun handles circular deps)
  await esbuild.build({ ...shared, entryPoints: [path.resolve(pkgRoot, "src/index.ts")], outfile: path.resolve(pkgRoot, "dist/index.js"), plugins: [createBasePlugin()] })

  // Browser bundle: single-file bundle.
  await esbuild.build({
    ...shared,
    entryPoints: [path.resolve(pkgRoot, "src/browser.ts")],
    outfile: path.resolve(pkgRoot, "dist/browser.js"),
    plugins: [createBasePlugin({ stubNative: true })],
  })

  // Post-process: fix circular dependency ordering.
  // esbuild may place Renderable's class definition AFTER classes that extend it
  // due to circular imports in the opentui source. We find the deferred Renderable
  // section and hoist it before the first class that needs it.
  const fs = await import("fs")
  let code = fs.readFileSync(path.resolve(pkgRoot, "dist/browser.js"), "utf-8")
  const lines = code.split("\n")

  // Find the SECOND occurrence of the Renderable.ts section marker (the deferred part)
  const marker = "// ../../opentui/packages/core/src/Renderable.ts"
  let firstIdx = -1, secondIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) {
      if (firstIdx === -1) firstIdx = i
      else { secondIdx = i; break }
    }
  }

  if (secondIdx !== -1) {
    // Find the end of the deferred section (next section marker or end of file)
    let endIdx = lines.length
    for (let i = secondIdx + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith("// ../../opentui/packages/")) {
        endIdx = i
        break
      }
    }

    // Extract the deferred section
    const deferredSection = lines.splice(secondIdx, endIdx - secondIdx)

    // Find the first "extends Renderable" or "extends BaseRenderable" class
    let insertBefore = -1
    for (let i = 0; i < lines.length; i++) {
      if (/class\s.*extends\s+(Renderable3|BaseRenderable)\b/.test(lines[i])) {
        insertBefore = i
        break
      }
    }

    if (insertBefore !== -1) {
      // Find the section start (previous section marker) to insert cleanly
      let sectionStart = insertBefore
      for (let i = insertBefore - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith("// ../../opentui/packages/")) {
          sectionStart = i
          break
        }
      }

      lines.splice(sectionStart, 0, ...deferredSection)
      fs.writeFileSync(path.resolve(pkgRoot, "dist/browser.js"), lines.join("\n"))
      console.log(`  Hoisted Renderable class definition (${deferredSection.length} lines) before first subclass`)
    }
  }
  console.log("✓ @gridland/core dist/index.js (bun) + dist/browser.js (browser)")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
