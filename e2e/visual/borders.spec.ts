import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Borders Visual", () => {
  test("border styles render correctly", async ({ page }) => {
    await page.goto("/borders")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("borders.png")
  })
})
