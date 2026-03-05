import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("TabBar Visual", () => {
  test("tab-bar renders correctly", async ({ page }) => {
    await page.goto("/tab-bar")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("tab-bar.png")
  })
})
