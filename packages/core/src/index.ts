// @gridland/core — full re-export of @opentui/core (browser-safe + native) and @opentui/react.
// The "bun" export condition resolves to this bundle (includes CLI renderer, etc.).
// Browser bundlers resolve the "import" condition to dist/browser.js instead.

export * from "@opentui/core"
// Native-only exports (zig FFI, CLI renderer, console, NativeSpanFeed).
// These are NOT in @opentui/core's browser-safe barrel, only in the /native subpath.
export { CliRenderer, CliRenderEvents, createCliRenderer } from "@opentui/core/native"
export type { MouseEvent } from "@opentui/core/native"
export { TerminalConsole, ConsolePosition, capture } from "@opentui/core/native"
export { NativeSpanFeed } from "@opentui/core/native"
export { setRenderLibPath } from "@opentui/core/native"
export * from "@opentui/react"
