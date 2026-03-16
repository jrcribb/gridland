#!/usr/bin/env node
/**
 * Pre-publish smoke test: packs all published packages as tarballs,
 * installs them in a temp directory (like a real user would), and
 * verifies the imports actually work at runtime.
 *
 * Run after `bun run build` and before `npm publish`.
 * Requires workspace:* deps to already be swapped to real versions.
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const ROOT = path.resolve(import.meta.dirname, "..")
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gridland-smoke-"))

function pack(pkgDir) {
  const output = execSync(`npm pack --pack-destination ${tmpDir}`, {
    cwd: pkgDir,
    encoding: "utf-8",
    timeout: 30000,
  }).trim()
  return path.join(tmpDir, output.split("\n").pop().trim())
}

try {
  console.log("Packing tarballs...")
  const tarballs = {
    utils: pack(path.join(ROOT, "packages/utils")),
    bun: pack(path.join(ROOT, "packages/bun")),
    demo: pack(path.join(ROOT, "packages/demo")),
  }

  // Check for workspace:* in packed tarballs
  console.log("Checking for workspace:* in tarballs...")
  for (const [name, tarball] of Object.entries(tarballs)) {
    const checkDir = fs.mkdtempSync(path.join(os.tmpdir(), "tarball-check-"))
    execSync(`tar xzf ${tarball} -C ${checkDir}`, { timeout: 10000 })
    const pkgJson = fs.readFileSync(path.join(checkDir, "package", "package.json"), "utf-8")
    fs.rmSync(checkDir, { recursive: true, force: true })
    if (pkgJson.includes("workspace:")) {
      console.error(`✗ ${name} tarball contains workspace:* — swap deps before publishing`)
      process.exit(1)
    }
  }

  // Install from tarballs (with overrides to force nested deps to use local tarballs too)
  console.log("Installing from tarballs...")
  const pkg = {
    type: "module",
    dependencies: {
      "@gridland/utils": `file:${tarballs.utils}`,
      "@gridland/bun": `file:${tarballs.bun}`,
      "@gridland/demo": `file:${tarballs.demo}`,
      react: "^19.0.0",
    },
    overrides: {
      "@gridland/utils": `file:${tarballs.utils}`,
      "@gridland/bun": `file:${tarballs.bun}`,
      "@gridland/demo": `file:${tarballs.demo}`,
    },
  }
  fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify(pkg, null, 2))
  execSync("bun install", { cwd: tmpDir, timeout: 30000, stdio: "pipe" })

  // Smoke test: import @gridland/demo/landing
  console.log("Testing import @gridland/demo/landing...")
  execSync(`bun -e 'import "@gridland/demo/landing"'`, {
    cwd: tmpDir,
    timeout: 10000,
    stdio: "pipe",
  })

  // Smoke test: import @gridland/bun (will fail if native deps missing, but should at least parse)
  console.log("Testing import @gridland/bun...")
  try {
    execSync(`bun -e 'import "@gridland/bun"'`, {
      cwd: tmpDir,
      timeout: 10000,
      stdio: "pipe",
    })
  } catch (e) {
    // Native FFI may fail in some envs — that's OK as long as the MODULE resolves
    const stderr = e.stderr?.toString() || ""
    if (stderr.includes("Cannot find module") || stderr.includes("not found in module") || stderr.includes("Export named")) {
      console.error(`✗ @gridland/bun import failed with module resolution error:`)
      console.error(stderr.trim())
      process.exit(1)
    }
    // Other errors (FFI, native lib) are OK — the package resolved correctly
    console.log("  (native FFI not available in this env, but module resolved OK)")
  }

  console.log("✓ All smoke tests passed")
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
