import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas } from "../helpers"

test.describe("TextInput Visual", () => {
  test("text-input renders correctly", async ({ page }) => {
    await page.goto("/text-input")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toHaveScreenshot("text-input.png")
  })
})
