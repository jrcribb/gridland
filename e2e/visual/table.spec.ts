import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("Table Visual", () => {
  test("table renders correctly", async ({ page }) => {
    await page.goto("/table")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("table.png")
  })
})
