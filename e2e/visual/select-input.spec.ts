import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("SelectInput Visual", () => {
  test("select-input renders correctly", async ({ page }) => {
    await page.goto("/select-input")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("select-input.png")
  })
})
