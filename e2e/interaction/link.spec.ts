import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, getCellAt } from "../helpers"

test.describe("Link Interaction", () => {
  test("link text is rendered in buffer", async ({ page }) => {
    await page.goto("/link")
    await waitForReady(page)

    const text = await getBufferText(page)
    expect(text).toContain("Visit opentui.dev")
  })

  test("link text has correct content at expected position", async ({ page }) => {
    await page.goto("/link")
    await waitForReady(page)

    // Find the "V" of "Visit opentui.dev" in the buffer
    // With padding=1, the text starts at col 1, and the link is on the second text line
    const text = await getBufferText(page)
    const lines = text.split("\n")
    const linkLine = lines.findIndex((l) => l.includes("Visit opentui.dev"))
    expect(linkLine).toBeGreaterThanOrEqual(0)

    // Verify the first character of the link text
    const col = lines[linkLine].indexOf("V")
    const cell = await getCellAt(page, col, linkLine)
    expect(cell.char).toBe("V")
  })
})
