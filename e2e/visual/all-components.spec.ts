import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("All Components Visual", () => {
  test("all components render together correctly", async ({ page }) => {
    await page.goto("/all-components")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("all-components.png")
  })
})
