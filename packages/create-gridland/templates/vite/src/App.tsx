// @ts-nocheck
import { TUI } from "@gridland/web"
import { useKeyboard } from "@opentui/react"
import { LandingApp } from "@gridland/demo/landing"

export function App() {
  return (
    <TUI style={{ width: "100vw", height: "100vh" }} backgroundColor="#1a1a2e">
      <LandingApp useKeyboard={useKeyboard} />
    </TUI>
  )
}
