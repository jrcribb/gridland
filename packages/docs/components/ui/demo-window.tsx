// @ts-nocheck — OpenTUI intrinsic elements conflict with React's HTML/SVG types
"use client"
import { useState, useRef, type ReactNode, type CSSProperties } from "react"
import { TUI } from "@gridland/web"
import {
  HeadlessRenderer,
  setHeadlessRootRenderableClass,
  createHeadlessRoot,
} from "@gridland/web"
import { RootRenderable } from "@opentui/core"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export interface DemoWindowProps {
  title?: string
  className?: string
  tuiStyle?: CSSProperties
  cols?: number
  rows?: number
  children: ReactNode
}

export function DemoWindow({
  title,
  className,
  tuiStyle,
  cols = 80,
  rows = 24,
  children,
}: DemoWindowProps) {
  const [mode, setMode] = useState<"browser" | "agent">("browser")
  const [asciiText, setAsciiText] = useState<string | null>(null)
  const asciiGeneratedRef = useRef(false)

  const switchToAgent = () => {
    if (!asciiGeneratedRef.current) {
      setHeadlessRootRenderableClass(RootRenderable)
      const renderer = new HeadlessRenderer({ cols, rows })
      const root = createHeadlessRoot(renderer)
      const text = root.renderToText(children)
      root.unmount()
      setAsciiText(text)
      asciiGeneratedRef.current = true
    }
    setMode("agent")
  }

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-lg overflow-hidden",
        className
      )}
      style={{ backgroundColor: "#1e1e2e" }}
    >
      {/* Title Bar */}
      <div
        className="grid grid-cols-3 items-center px-3 py-2.5 border-b"
        style={{ backgroundColor: "#2a2a3c", borderColor: "#313244" }}
      >
        {/* Traffic Lights */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>
        {/* Title */}
        {title && (
          <div
            className="text-center text-sm select-none"
            style={{ color: "#a6adc8" }}
          >
            {title}
          </div>
        )}
        {/* Toggle */}
        <div className="flex justify-end">
          <div
            className="inline-flex rounded-md overflow-hidden"
            style={{ border: "1px solid #313244" }}
          >
            <button
              type="button"
              className="text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80"
              style={{
                backgroundColor:
                  mode === "browser" ? "#3a3a4c" : "transparent",
                color: mode === "browser" ? "#cdd6f4" : "#6c7086",
                borderRight: "1px solid #313244",
              }}
              onClick={() => setMode("browser")}
            >
              Browser
            </button>
            <button
              type="button"
              className="text-xs px-2 py-0.5 transition-colors cursor-pointer hover:opacity-80"
              style={{
                backgroundColor:
                  mode === "agent" ? "#3a3a4c" : "transparent",
                color: mode === "agent" ? "#cdd6f4" : "#6c7086",
              }}
              onClick={switchToAgent}
            >
              SSR
            </button>
          </div>
          <a
            href="/docs/guides/ssr-for-agents"
            title="SSR for Agents"
            className="ml-1.5 inline-flex items-center justify-center rounded-full text-xs px-1.5 py-0.5 transition-colors"
            style={{ color: "#6c7086", border: "1px solid #313244", textDecoration: "none" }}
          >
            ?
          </a>
        </div>
      </div>
      {/* Content */}
      <div className="overflow-x-auto overscroll-x-none">
        <div style={{ display: mode === "browser" ? "block" : "none" }}>
          <TUI style={tuiStyle}>{children}</TUI>
        </div>
        {mode === "agent" && asciiText != null && (
          <pre
            style={{
              margin: 0,
              padding: "8px 12px",
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              fontSize: 14,
              lineHeight: 1.3,
              backgroundColor: "#1e1e2e",
              color: "#cdd6f4",
              whiteSpace: "pre",
              overflowX: "auto",
            }}
          >
            {asciiText}
          </pre>
        )}
      </div>
    </div>
  )
}
