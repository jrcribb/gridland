#!/usr/bin/env node
/**
 * Builds @gridland/bun:
 * - dist/index.js — Bun-native ESM bundle
 *
 * Bundles the native-only opentui files (zig, renderer, console, NativeSpanFeed).
 * Shared modules (renderables, buffer, zig-registry, etc.) are externalized
 * to @gridland/utils to ensure a single shared instance of the registry.
 *
 * After building, validates that every named import from @gridland/utils
 * actually exists in the utils bundle's exports. This prevents publishing
 * broken packages that reference internal-only symbols.
 */
import * as esbuild from "esbuild"
import path from "path"
import { readFileSync, copyFileSync } from "fs"
import { fileURLToPath } from "url"

const pkgRoot = path.dirname(fileURLToPath(import.meta.url))
const opentuiRoot = path.resolve(pkgRoot, "../../opentui/packages")
const coreSrc = path.resolve(opentuiRoot, "core/src")

// These files are native-only and should be bundled into @gridland/bun.
// Everything else from opentui/core/src is already in @gridland/utils.
// When native files import internal utilities (singleton, keymapping, etc.),
// those must be listed here too — otherwise they get externalized to
// @gridland/utils which doesn't export them.
const nativeFiles = new Set([
  "zig.ts",
  "zig-structs.ts",
  "native.ts",
  "renderer.ts",
  "console.ts",
  "NativeSpanFeed.ts",
  "ansi.ts",
  "lib/singleton.ts",
  "lib/stdin-buffer.ts",
  "lib/bunfs.ts",
  "lib/output.capture.ts",
  "lib/data-paths.ts",
  "lib/KeyHandler.ts",
  "lib/keymapping.ts",
  "lib/clipboard.ts",
  "lib/objects-in-viewport.ts",
  "lib/parse.keypress.ts",
  "lib/parse.keypress-kitty.ts",
  "lib/terminal-capability-detection.ts",
].map(f => path.resolve(coreSrc, f)))

// Build a second Set without .ts extensions for extensionless lookups
const nativeFilesNoExt = new Set([...nativeFiles].map(f => f.replace(/\.ts$/, "")))

function isNativeFile(filePath) {
  const normalized = path.resolve(filePath)
  return nativeFiles.has(normalized) || nativeFilesNoExt.has(normalized)
}

function createPlugin() {
  return {
    name: "bun-bundle",
    setup(build) {
      // @gridland/utils is external — shared instance
      build.onResolve({ filter: /^@gridland\/utils$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/core barrel → @gridland/utils (external)
      build.onResolve({ filter: /^@opentui\/core$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/react → @gridland/utils (external)
      build.onResolve({ filter: /^@opentui\/react$/ }, () => ({
        path: "@gridland/utils",
        external: true,
      }))

      // Resolve @opentui/core/native to source (this IS native code we bundle)
      build.onResolve({ filter: /^@opentui\/core\/native$/ }, () => ({
        path: path.resolve(opentuiRoot, "core/src/native.ts"),
      }))

      // Relative imports from within opentui/core/src:
      // If the resolved file is NOT a native file, externalize to @gridland/utils
      build.onResolve({ filter: /^\./ }, (args) => {
        if (!args.resolveDir || !args.resolveDir.includes("opentui/packages/core/src")) return null

        const resolved = path.resolve(args.resolveDir, args.path)
        const candidates = [resolved, resolved + ".ts", resolved + "/index.ts"]

        for (const candidate of candidates) {
          if (isNativeFile(candidate)) {
            return null // Let esbuild bundle it normally
          }
        }

        // Not a native file → it's in @gridland/utils
        return { path: "@gridland/utils", external: true }
      })
    },
  }
}

// require() shim for CJS packages in ESM bundle.
const requireShimBanner = [
  `import * as __REACT$ from "react";`,
  `var __EXT$ = { "react": __REACT$ };`,
  `var require = globalThis.require || ((id) => {`,
  `  var m = __EXT$[id];`,
  `  if (m) return m;`,
  `  throw new Error('Dynamic require of "' + id + '" is not supported');`,
  `});`,
].join(" ")

/**
 * Post-build validation: ensure every named import from @gridland/utils
 * in the bun bundle actually exists in the utils bundle's exports.
 */
function validateExternalImports() {
  const bunSrc = readFileSync(path.resolve(pkgRoot, "dist/index.js"), "utf-8")
  const utilsSrc = readFileSync(path.resolve(pkgRoot, "../utils/dist/index.js"), "utf-8")

  // Collect all named imports from @gridland/utils
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@gridland\/utils['"]/g
  const imports = new Set()
  let match
  while ((match = importRegex.exec(bunSrc)) !== null) {
    match[1].split(",").forEach(s => {
      const name = s.trim().split(/\s+as\s+/)[0].trim()
      if (name) imports.add(name)
    })
  }

  // Collect all exports from @gridland/utils
  const exportMatch = utilsSrc.match(/export\s*\{([^}]+)\}/s)
  const exports = new Set()
  if (exportMatch) {
    exportMatch[1].split(",").forEach(s => {
      const parts = s.trim().split(/\s+as\s+/)
      const exportedName = (parts[1] || parts[0]).trim()
      if (exportedName) exports.add(exportedName)
    })
  }

  const missing = [...imports].filter(i => !exports.has(i))
  if (missing.length > 0) {
    console.error("\n✗ @gridland/bun imports symbols from @gridland/utils that don't exist:")
    missing.forEach(m => console.error(`    - ${m}`))
    console.error("\n  These files need to be added to nativeFiles in build-bun.mjs")
    console.error("  so they get bundled into @gridland/bun instead of externalized.\n")
    process.exit(1)
  }
}

async function main() {
  await esbuild.build({
    entryPoints: [path.resolve(pkgRoot, "src/index.ts")],
    outfile: path.resolve(pkgRoot, "dist/index.js"),
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "esnext",
    sourcemap: true,
    external: [
      "react", "react-dom",
      "@gridland/utils",
      "bun:ffi", "bun",
      "events",
      "fs", "fs/promises", "path", "os", "stream", "url", "util",
      "node:fs", "node:path", "node:os", "node:stream", "node:url",
      "node:util", "node:buffer", "node:console", "node:child_process",
      "node:net", "node:tty", "node:process", "node:events",
      "tree-sitter-styled-text", "web-tree-sitter", "hast-styled-text",
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

  // Validate that all external imports resolve
  validateExternalImports()

  console.log("✓ @gridland/bun dist/index.js + dist/index.d.ts")
}

main().catch((e) => {
  console.error("Build failed:", e.message)
  process.exit(1)
})
