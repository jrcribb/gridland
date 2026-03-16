import React, { type ReactNode } from "react"
import type { BrowserRenderer } from "./browser-renderer"
import { BrowserContext } from "./browser-context"

// Import from core react
import { _render } from "../packages/core/src/react/reconciler/reconciler"
import { AppContext } from "../packages/core/src/react/components/app"
import { ErrorBoundary } from "../packages/core/src/react/components/error-boundary"

export interface BrowserRoot {
  render(node: ReactNode): void
  unmount(): void
}

export function createBrowserRoot(renderer: BrowserRenderer): BrowserRoot {
  let unmountFn: (() => void) | null = null

  return {
    render(node: ReactNode) {
      const element = (
        <BrowserContext.Provider value={{ renderContext: renderer.renderContext }}>
          <AppContext.Provider value={{ keyHandler: renderer.renderContext.keyInput as any, renderer: null }}>
            <ErrorBoundary>{node}</ErrorBoundary>
          </AppContext.Provider>
        </BrowserContext.Provider>
      )
      unmountFn = _render(element, renderer.root)
    },
    unmount() {
      if (unmountFn) {
        // Reconciler cleanup would happen here
      }
    },
  }
}
