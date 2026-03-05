import { plugin } from "bun"
import path from "path"
import fs from "fs"
import os from "os"

// Pre-load React and cache on globalThis for the patched reconciler.
// Without this, the opentui reconciler and polyterm-ui components use
// different React copies, breaking hooks.
const _react = await import("react")
;(globalThis as any).__OPENTUI_REACT = _react.default ?? _react

// Find react-reconciler in opentui's node_modules
const opentui = path.resolve(import.meta.dir, "../../../../opentui")
const reconcilerCjsPath = path.join(
  opentui,
  "node_modules/.bun/react-reconciler@0.32.0+83d5fd7b249dbeef/node_modules/react-reconciler/cjs/react-reconciler.development.js",
)
const schedulerPath = path.join(
  opentui,
  "node_modules/.bun/scheduler@0.26.0/node_modules/scheduler/index.js",
)
const constantsCjsPath = path.join(
  opentui,
  "node_modules/.bun/react-reconciler@0.32.0+83d5fd7b249dbeef/node_modules/react-reconciler/cjs/react-reconciler-constants.development.js",
)

const tmpDir = path.join(os.tmpdir(), "polyterm-demo-shims")
fs.mkdirSync(tmpDir, { recursive: true })

// Patch reconciler to use our shared React instead of its own require("react")
const reconcilerSource = fs.readFileSync(reconcilerCjsPath, "utf8")
const reconcilerPatched = reconcilerSource
  .replace(/var React = require\("react"\)/, "var React = globalThis.__OPENTUI_REACT")
  .replace(/Scheduler = require\("scheduler"\)/, `Scheduler = require("${schedulerPath}")`)

const tmpReconcilerPath = path.join(tmpDir, "react-reconciler.js")
fs.writeFileSync(tmpReconcilerPath, reconcilerPatched)

const constantsSource = fs.readFileSync(constantsCjsPath, "utf8")
const tmpConstantsPath = path.join(tmpDir, "react-reconciler-constants.js")
fs.writeFileSync(tmpConstantsPath, constantsSource)

const _reconcilerFactory = await import(tmpReconcilerPath)
;(globalThis as any).__OPENTUI_RECONCILER_FACTORY = _reconcilerFactory.default ?? _reconcilerFactory
const _reconcilerConstants = await import(tmpConstantsPath)
;(globalThis as any).__OPENTUI_RECONCILER_CONSTANTS = _reconcilerConstants.default ?? _reconcilerConstants

const reactPath = import.meta.resolveSync("react")

plugin({
  name: "polyterm-demo-shims",
  setup(build) {
    // Patch reconciler.ts to use our pre-loaded patched reconciler factory
    build.onLoad({ filter: /opentui\/packages\/react\/src\/reconciler\/reconciler\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, "utf8")
      const patched = source
        .replace(
          /import ReactReconciler from "react-reconciler"/,
          "const ReactReconciler = (globalThis as any).__OPENTUI_RECONCILER_FACTORY",
        )
        .replace(
          /import \{ ConcurrentRoot \} from "react-reconciler\/constants"/,
          "const { ConcurrentRoot } = (globalThis as any).__OPENTUI_RECONCILER_CONSTANTS",
        )
      return { contents: patched, loader: "ts" }
    })

    // Redirect all React imports from opentui source to our single copy.
    // Exclude reconciler.ts (handled above) using a negative lookahead.
    build.onLoad({ filter: /opentui\/packages\/react\/src\/(?!reconciler\/reconciler\.ts).*\.tsx?$/ }, (args) => {
      const source = fs.readFileSync(args.path, "utf8")
      const patched = source.replace(/from "react"/g, `from "${reactPath}"`)
      return { contents: patched, loader: args.path.endsWith(".tsx") ? "tsx" : "ts" }
    })
  },
})
