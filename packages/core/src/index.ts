// @gridland/core — portable hooks and utilities
// Works in both browser and CLI environments via opentui React context.

// Full @opentui/core (browser shims) and @opentui/react modules.
// Both are bundled here so @gridland/web can externalize them, ensuring
// a single copy of React contexts and yoga-layout at runtime.
export * from "@opentui/core"
export * from "@opentui/react"

// Internal reconciler symbols re-exported for @gridland/web's browser root.
// These are NOT part of the public API — @gridland/web uses them to share
// the same React context instances as core's hooks.
export { _render, reconciler } from "../../../opentui/packages/react/src/reconciler/reconciler"
// ErrorBoundary uses opentui JSX intrinsics that conflict with React's types,
// so we re-export with a cast to avoid DTS errors.
import { ErrorBoundary as _EB } from "../../../opentui/packages/react/src/components/error-boundary"
export const ErrorBoundary = _EB as any

// Headless rendering
export { bufferToText } from "../../web/src/buffer-to-text"
export { HeadlessRenderer, setHeadlessRootRenderableClass } from "../../web/src/headless-renderer"
export type { HeadlessRendererOptions } from "../../web/src/headless-renderer"
export { createHeadlessRoot } from "../../web/src/create-headless-root"
export type { HeadlessRoot } from "../../web/src/create-headless-root"

// Shared React context
export { BrowserContext } from "../../web/src/browser-context"
export type { BrowserContextValue } from "../../web/src/browser-context"

// Utilities
export { isBrowser, isCanvasSupported, calculateGridSize } from "../../web/src/utils"
