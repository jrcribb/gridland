import type { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return <div style={{ backgroundColor: "#1a1a2e", minHeight: "100vh" }}>{children}</div>
}
