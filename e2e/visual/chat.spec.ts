import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Chat Visual", () => {
  test("chat renders correctly", async ({ page }) => {
    await page.goto("/chat")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("chat.png")
  })
})
