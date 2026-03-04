import { test, expect } from "@playwright/test"
import { waitForReady, getBufferText, focusCanvas } from "../helpers"

test.describe("TextInput Interaction", () => {
  test("typing text appears in buffer", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // Type with delay so the renderer can process each keystroke
    await page.keyboard.type("hello", { delay: 50 })
    await page.waitForTimeout(300)

    const text = await getBufferText(page)
    expect(text).toContain("hello")
  })

  test("Backspace deletes characters", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    // Type then delete
    await page.keyboard.type("abc", { delay: 50 })
    await page.waitForTimeout(200)
    await page.keyboard.press("Backspace")
    await page.waitForTimeout(200)

    const text = await getBufferText(page)
    expect(text).toContain("ab")
    // The "c" should be removed
    expect(text).not.toContain("abc")
  })

  test("prompt is visible", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)

    const text = await getBufferText(page)
    expect(text).toContain("Enter your name:")
    // The prompt "> " should be in the buffer
    expect(text).toContain(">")
  })

  test("typed text shows in feedback line", async ({ page }) => {
    await page.goto("/text-input-interactive")
    await waitForReady(page)
    await focusCanvas(page)

    await page.keyboard.type("world", { delay: 50 })
    await page.waitForTimeout(300)

    const text = await getBufferText(page)
    // The onChange handler renders "You typed: world"
    expect(text).toContain("You typed: world")
  })
})
