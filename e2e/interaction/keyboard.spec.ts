import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, focusCanvas } from "../helpers"

test.describe("Keyboard Event Handling", () => {
  test("canvas receives keyboard focus", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)

    const canvas = page.locator("canvas")
    await canvas.click()

    // Verify the canvas is the active element
    const isFocused = await canvas.evaluate((el) => document.activeElement === el)
    expect(isFocused).toBe(true)
  })

  test("typing in text-input updates the buffer", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // Type with delay so each key is processed
    await page.keyboard.type("test123", { delay: 50 })
    await page.waitForTimeout(300)

    const text = await getBufferText(page)
    expect(text).toContain("test123")
  })

  test("select-input responds to keyboard navigation", async ({ page }) => {
    await page.goto("/select-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // The heading should be visible regardless
    const text = await getBufferText(page)
    expect(text).toContain("Choose a language:")

    // Press Enter to select, should show "Selected:" feedback
    await page.keyboard.press("Enter")
    await page.waitForTimeout(200)

    const afterEnter = await getBufferText(page)
    expect(afterEnter).toContain("Selected:")
  })
})
