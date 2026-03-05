import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Modal Visual", () => {
  test("modal renders correctly", async ({ page }) => {
    await page.goto("/modal")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("modal.png")
  })
})
