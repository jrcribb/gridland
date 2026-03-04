import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Link Visual", () => {
  test("link renders correctly", async ({ page }) => {
    await page.goto("/link")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("link.png")
  })
})
