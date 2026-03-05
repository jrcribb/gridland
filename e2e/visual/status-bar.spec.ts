import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("StatusBar Visual", () => {
  test("status-bar renders correctly", async ({ page }) => {
    await page.goto("/status-bar")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("status-bar.png")
  })
})
