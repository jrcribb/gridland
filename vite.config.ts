import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

const coreSrc = path.resolve(__dirname, "packages/core/src")
const coreShims = path.resolve(__dirname, "src/core-shims/index.ts")
const nodeModules = path.resolve(__dirname, "node_modules")

// Map of core source files that need to be replaced with browser shims.
// Keys are basenames (without .ts) relative to packages/core/src/.
const coreFileShims: Record<string, string> = {
  zig: "src/shims/zig-stub.ts",
  buffer: "src/browser-buffer.ts",
  "text-buffer": "src/shims/text-buffer-shim.ts",
  "text-buffer-view": "src/shims/text-buffer-view-shim.ts",
  "syntax-style": "src/shims/syntax-style-shim.ts",
  renderer: "src/shims/renderer-stub.ts",
  console: "src/shims/console-stub.ts",
  "edit-buffer": "src/shims/edit-buffer-stub.ts",
  "editor-view": "src/shims/editor-view-stub.ts",
  NativeSpanFeed: "src/shims/native-span-feed-stub.ts",
  "post/filters": "src/shims/filters-stub.ts",
  "animation/Timeline": "src/shims/timeline-stub.ts",
}

// Resolve all shim paths once at startup
const resolvedCoreShims = new Map<string, string>()
for (const [key, shimPath] of Object.entries(coreFileShims)) {
  const absoluteTarget = path.resolve(coreSrc, key + ".ts")
  resolvedCoreShims.set(absoluteTarget, path.resolve(__dirname, shimPath))
}

// Note: We do NOT redirect the core barrel (index.ts) to our core-shims because
// it creates circular dependencies when renderables import from "../index".
// Instead, we let the core barrel load naturally, with our plugin intercepting
// its zig-dependent imports (buffer, text-buffer, etc.).

// Plugin to intercept core imports that can't be handled by simple aliases
function coreShimsPlugin(): Plugin {
  const treeStub = path.resolve(__dirname, "src/shims/tree-sitter-stub.ts")
  const styledTextStub = path.resolve(__dirname, "src/shims/tree-sitter-styled-text-stub.ts")
  const coreBarrel = path.resolve(coreSrc, "index.ts")
  const sliderDeps = path.resolve(__dirname, "src/shims/slider-deps.ts")
  const sliderFile = path.resolve(coreSrc, "renderables/Slider.ts")
  return {
    name: "core-shims",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null

      // Slider.ts imports from "../index" creating a circular dep within the barrel.
      // Redirect to a minimal deps file that provides only what Slider needs.
      if (source === "../index" && importer === sliderFile) {
        return sliderDeps
      }

      // Resolve @gridland/ui and @gridland/react bare specifiers
      if (source === "@gridland/ui") {
        return path.resolve(__dirname, "packages/ui/components/index.ts")
      }
      if (source === "@gridland/react") {
        return path.resolve(coreSrc, "react/index.ts")
      }

      // When the core react package imports @gridland/core, redirect to
      // the REAL core barrel (not our core-shims). The core barrel's
      // zig-dependent imports are handled by the file-level redirects below.
      // This avoids cross-barrel circular dependency issues.
      if (source === "@gridland/core" && importer.includes("packages/core/src/react")) {
        return coreBarrel
      }

      // For relative imports from within the core tree, resolve and check against shims
      if (source.startsWith(".") && importer.includes("packages/core")) {
        const importerDir = path.dirname(importer)
        const resolved = path.resolve(importerDir, source)
        // Try exact match, then with .ts extension
        const shim = resolvedCoreShims.get(resolved) || resolvedCoreShims.get(resolved + ".ts")
        if (shim) return shim
        // Also try resolving with /index.ts for directory imports
        const indexShim = resolvedCoreShims.get(resolved + "/index.ts")
        if (indexShim) return indexShim
      }

      // Intercept tree-sitter imports
      if (source.includes("tree-sitter") && importer.includes("packages/core")) {
        if (source.includes("tree-sitter-styled-text")) return styledTextStub
        return treeStub
      }
      // Intercept hast-styled-text
      if (source.includes("hast-styled-text") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/hast-stub.ts")
      }
      // Intercept Node.js built-in modules
      if (source === "node:buffer" && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-buffer.ts")
      }
      if ((source === "node:path" || source === "path") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-path.ts")
      }
      if ((source === "node:fs" || source === "fs") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-fs.ts")
      }
      if ((source === "node:util" || source === "util") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-util.ts")
      }
      if ((source === "os" || source === "node:os") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-os.ts")
      }
      if ((source === "stream" || source === "node:stream") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-stream.ts")
      }
      if ((source === "url" || source === "node:url") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-url.ts")
      }
      if ((source === "fs/promises") && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/node-fs.ts")
      }
      // Intercept Bun global
      if (source === "bun" && importer.includes("packages/core")) {
        return path.resolve(__dirname, "src/shims/bun-ffi.ts")
      }
      // Handle @gridland/core imports:
      // - From the react package -> use real core barrel (avoids cross-barrel cycles)
      // - From our code -> use core-shims barrel (has browser replacements)
      if (source === "@gridland/core") {
        if (importer.includes("packages/core/src/react")) {
          return coreBarrel
        }
        return coreShims
      }
      return null
    },
  }
}

export default defineConfig({
  define: {
    "process.env": JSON.stringify({}),
  },
  plugins: [coreShimsPlugin(), react()],
  resolve: {
    alias: {
      // NOTE: @gridland/core is handled by the plugin, NOT here.
      // The plugin routes react-package imports to the real barrel and our imports to core-shims.
      // Redirect core internal imports that reference zig/FFI modules
      [path.resolve(coreSrc, "zig")]: path.resolve(__dirname, "src/shims/zig-stub.ts"),
      [path.resolve(coreSrc, "buffer")]: path.resolve(__dirname, "src/browser-buffer.ts"),
      [path.resolve(coreSrc, "text-buffer")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-shim.ts",
      ),
      [path.resolve(coreSrc, "text-buffer-view")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-view-shim.ts",
      ),
      [path.resolve(coreSrc, "syntax-style")]: path.resolve(
        __dirname,
        "src/shims/syntax-style-shim.ts",
      ),
      [path.resolve(coreSrc, "renderer")]: path.resolve(__dirname, "src/shims/renderer-stub.ts"),
      [path.resolve(coreSrc, "console")]: path.resolve(__dirname, "src/shims/console-stub.ts"),
      [path.resolve(coreSrc, "edit-buffer")]: path.resolve(
        __dirname,
        "src/shims/edit-buffer-stub.ts",
      ),
      [path.resolve(coreSrc, "editor-view")]: path.resolve(
        __dirname,
        "src/shims/editor-view-stub.ts",
      ),
      [path.resolve(coreSrc, "NativeSpanFeed")]: path.resolve(
        __dirname,
        "src/shims/native-span-feed-stub.ts",
      ),
      [path.resolve(coreSrc, "post/filters")]: path.resolve(
        __dirname,
        "src/shims/filters-stub.ts",
      ),
      [path.resolve(coreSrc, "animation/Timeline")]: path.resolve(
        __dirname,
        "src/shims/timeline-stub.ts",
      ),
      // FFI shims
      "bun:ffi": path.resolve(__dirname, "src/shims/bun-ffi.ts"),
      "bun-ffi-structs": path.resolve(__dirname, "src/shims/bun-ffi-structs.ts"),
      "node:console": path.resolve(__dirname, "src/shims/console.ts"),
      // Ensure npm packages resolve from our node_modules
      "react-reconciler": path.resolve(nodeModules, "react-reconciler"),
      "react-reconciler/constants": path.resolve(nodeModules, "react-reconciler/constants.js"),
      react: path.resolve(nodeModules, "react"),
      "yoga-layout": path.resolve(nodeModules, "yoga-layout"),
      events: path.resolve(nodeModules, "events"),
      diff: path.resolve(nodeModules, "diff"),
      marked: path.resolve(nodeModules, "marked"),
    },
    dedupe: ["react", "react-reconciler", "yoga-layout", "events"],
  },
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    fs: {
      allow: [__dirname],
    },
  },
  test: {
    globals: true,
    environment: "node",
    alias: {
      "@gridland/core": coreShims,
      "bun:ffi": path.resolve(__dirname, "src/shims/bun-ffi.ts"),
      [path.resolve(coreSrc, "zig")]: path.resolve(__dirname, "src/shims/zig-stub.ts"),
      [path.resolve(coreSrc, "buffer")]: path.resolve(__dirname, "src/browser-buffer.ts"),
      [path.resolve(coreSrc, "text-buffer")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-shim.ts",
      ),
      [path.resolve(coreSrc, "text-buffer-view")]: path.resolve(
        __dirname,
        "src/shims/text-buffer-view-shim.ts",
      ),
      [path.resolve(coreSrc, "syntax-style")]: path.resolve(
        __dirname,
        "src/shims/syntax-style-shim.ts",
      ),
      [path.resolve(coreSrc, "renderer")]: path.resolve(__dirname, "src/shims/renderer-stub.ts"),
      [path.resolve(coreSrc, "console")]: path.resolve(__dirname, "src/shims/console-stub.ts"),
      [path.resolve(coreSrc, "edit-buffer")]: path.resolve(
        __dirname,
        "src/shims/edit-buffer-stub.ts",
      ),
      [path.resolve(coreSrc, "editor-view")]: path.resolve(
        __dirname,
        "src/shims/editor-view-stub.ts",
      ),
      [path.resolve(coreSrc, "NativeSpanFeed")]: path.resolve(
        __dirname,
        "src/shims/native-span-feed-stub.ts",
      ),
      [path.resolve(coreSrc, "post/filters")]: path.resolve(
        __dirname,
        "src/shims/filters-stub.ts",
      ),
      [path.resolve(coreSrc, "animation/Timeline")]: path.resolve(
        __dirname,
        "src/shims/timeline-stub.ts",
      ),
    },
  },
})
