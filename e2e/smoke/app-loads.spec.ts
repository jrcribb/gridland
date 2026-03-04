import { test, expect } from "@playwright/test"
import { waitForReady, getCanvas, getBufferText } from "../helpers"

test.describe("Smoke Tests", () => {
  test("table fixture loads and renders content", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => errors.push(err.message))

    await page.goto("/table")
    await waitForReady(page)

    const canvas = getCanvas(page)
    await expect(canvas).toBeVisible()

    // Verify canvas has non-zero dimensions
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)

    // Verify buffer has content (not all spaces)
    const text = await getBufferText(page)
    expect(text.trim().length).toBeGreaterThan(0)

    // No console errors
    expect(errors).toEqual([])
  })

  test("index page lists all fixtures", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=E2E Test Harness")).toBeVisible()
    await expect(page.locator("a[href='/table']")).toBeVisible()
    await expect(page.locator("a[href='/select-input']")).toBeVisible()
    await expect(page.locator("a[href='/text-input']")).toBeVisible()
  })

  test("all fixture routes load without errors", async ({ page }) => {
    const routes = [
      "/table",
      "/select-input",
      "/select-input-interactive",
      "/text-input",
      "/text-input-interactive",
      "/link",
      "/borders",
      "/all-components",
    ]

    for (const route of routes) {
      const errors: string[] = []
      page.on("pageerror", (err) => errors.push(err.message))

      await page.goto(route)
      await waitForReady(page)

      const canvas = getCanvas(page)
      await expect(canvas).toBeVisible()

      expect(errors).toEqual([])
    }
  })
})
