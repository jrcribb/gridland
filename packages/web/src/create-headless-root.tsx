import React, { type ReactNode } from "react"
import type { HeadlessRenderer } from "./headless-renderer"
import { BrowserContext } from "./browser-context"

import { _render, reconciler } from "../../core/src/react/reconciler/reconciler"
import { AppContext } from "../../core/src/react/components/app"
import { ErrorBoundary as _ErrorBoundary } from "../../core/src/react/components/error-boundary"

const ErrorBoundary = _ErrorBoundary as unknown as React.ComponentType<{ children: React.ReactNode }>

// flushSync was renamed to flushSyncFromReconciler in react-reconciler 0.32.0
const _r = reconciler as typeof reconciler & { flushSyncFromReconciler?: typeof reconciler.flushSync }
const flushSync = _r.flushSyncFromReconciler ?? _r.flushSync

export interface HeadlessRoot {
  render(node: ReactNode): void
  renderToText(node: ReactNode): string
  unmount(): void
}

export function createHeadlessRoot(renderer: HeadlessRenderer): HeadlessRoot {
  let container: any = null

  return {
    render(node: ReactNode) {
      const element = (
        <BrowserContext.Provider value={{ renderContext: renderer.renderContext }}>
          <AppContext.Provider
            value={{
              keyHandler: renderer.renderContext.keyInput as any,
              renderer: renderer.renderContext as any,
            }}
          >
            <ErrorBoundary>{node}</ErrorBoundary>
          </AppContext.Provider>
        </BrowserContext.Provider>
      )
      container = _render(element, renderer.root)
    },
    renderToText(node: ReactNode): string {
      flushSync(() => {
        this.render(node)
      })
      renderer.renderOnce()
      return renderer.toText()
    },
    unmount() {
      if (container) {
        reconciler.updateContainer(null, container, null, () => {})
        // @ts-ignore the types for `react-reconciler` are not up to date with the library.
        reconciler.flushSyncWork()
        container = null
      }
    },
  }
}
