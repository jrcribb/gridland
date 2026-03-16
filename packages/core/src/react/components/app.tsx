import type { KeyHandler } from "../../lib/KeyHandler"
import type { CliRenderer } from "../../native"
import { createContext, useContext } from "react"
import { singleton } from "../../lib/singleton"

interface AppContext {
  keyHandler: KeyHandler | null
  renderer: CliRenderer | null
}

// Use singleton to ensure the same React Context is shared across
// independently bundled packages (@gridland/utils + @gridland/bun).
export const AppContext = singleton("AppContext", () =>
  createContext<AppContext>({
    keyHandler: null,
    renderer: null,
  }),
)

export const useAppContext = () => {
  return useContext(AppContext)
}
