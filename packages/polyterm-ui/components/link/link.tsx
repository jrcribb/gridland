import type { ReactNode } from "react"

export type UnderlineStyle = "solid" | "dotted" | "none"

// Attribute bits matching opentui core TextAttributes
const UNDERLINE = 1 << 3
const UNDERLINE_DOTTED = 1 << 4 // repurposed BLINK bit for dotted underline in browser

export interface LinkProps {
  children: ReactNode
  url: string
  underline?: UnderlineStyle
}

export function Link({ children, url, underline = "solid" }: LinkProps) {
  let attributes = 0
  if (underline === "solid") {
    attributes = UNDERLINE
  } else if (underline === "dotted") {
    attributes = UNDERLINE | UNDERLINE_DOTTED
  }

  return (
    <text>
      <a href={url} style={{ attributes }}>{children}</a>
    </text>
  )
}
