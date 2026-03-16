// @gridland/bun — full Bun runtime. Monolithic engine + native FFI in one file.
// No engine code crosses package boundaries — prevents segfaults from bun:ffi
// pointers crossing npm package scopes.

// Full engine (bundled monolithically from core source)
export * from "../../core/src/index"

// React reconciler + hooks + components (bundled monolithically)
// Hooks/AppContext use globalThis singletons for sharing with @gridland/utils.
export * from "../../core/src/react"

// Side-effect: register native FFI via zig bindings
import "../../core/src/zig"

// Native-only exports (not in core/index.ts because they're not browser-safe)
export { CliRenderer, CliRenderEvents, createCliRenderer } from "../../core/src/renderer"
export type { MouseEvent } from "../../core/src/renderer"
export { TerminalConsole, ConsolePosition, capture } from "../../core/src/console"
export { NativeSpanFeed } from "../../core/src/NativeSpanFeed"
export { setRenderLibPath } from "../../core/src/zig"
