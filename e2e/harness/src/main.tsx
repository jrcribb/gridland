import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/700.css"
import { createRoot } from "react-dom/client"
import { TableFixture } from "./fixtures/table"
import { SelectInputFixture } from "./fixtures/select-input"
import { SelectInputInteractiveFixture } from "./fixtures/select-input-interactive"
import { TextInputFixture } from "./fixtures/text-input"
import { TextInputInteractiveFixture } from "./fixtures/text-input-interactive"
import { LinkFixture } from "./fixtures/link"
import { BordersFixture } from "./fixtures/borders"
import { AllComponentsFixture } from "./fixtures/all-components"
import { TabBarFixture } from "./fixtures/tab-bar"
import { StatusBarFixture } from "./fixtures/status-bar"
import { ModalFixture } from "./fixtures/modal"
import { ChatFixture } from "./fixtures/chat"

const routes: Record<string, () => JSX.Element> = {
  "/table": TableFixture,
  "/select-input": SelectInputFixture,
  "/select-input-interactive": SelectInputInteractiveFixture,
  "/text-input": TextInputFixture,
  "/text-input-interactive": TextInputInteractiveFixture,
  "/link": LinkFixture,
  "/borders": BordersFixture,
  "/all-components": AllComponentsFixture,
  "/tab-bar": TabBarFixture,
  "/status-bar": StatusBarFixture,
  "/modal": ModalFixture,
  "/chat": ChatFixture,
}

function App() {
  const path = window.location.pathname
  const Fixture = routes[path]

  if (!Fixture) {
    return (
      <div style={{ color: "#cdd6f4", padding: 20, fontFamily: "JetBrains Mono, monospace" }}>
        <h2>E2E Test Harness</h2>
        <p>Available fixtures:</p>
        <ul>
          {Object.keys(routes).map((route) => (
            <li key={route}>
              <a href={route} style={{ color: "#89b4fa" }}>{route}</a>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return <Fixture />
}

createRoot(document.getElementById("root")!).render(<App />)
