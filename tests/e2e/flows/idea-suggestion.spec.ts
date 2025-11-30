// @ts-nocheck
import { test, expect } from "@playwright/test";
import { enableTestMode } from "../setup/testModeSetup";
import { USER_A } from "../setup/testUsers";
import { setupSupabaseMocks } from "../helpers/supabase-mocks";
import { setupComprehensiveMocks } from "../helpers/comprehensive-mocks";

test.describe("Idea Suggestion Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.unroute("**");
    await setupSupabaseMocks(page);
    await setupComprehensiveMocks(page);
    await enableTestMode(page, USER_A);
  });

  test("user can navigate to suggest idea from profile", async ({ page }) => {
    // Navigate to profile
    await page.goto("/home/profile", { waitUntil: "domcontentloaded" });

    // Wait for profile page to load - use more flexible selector
    await page
      .waitForFunction(
        () => {
          const heading = document.querySelector("h1");
          return heading && heading.textContent?.includes("Profile");
        },
        { timeout: 15000 }
      )
      .catch(() => {});

    // Find and click "Suggest an Idea" or "Submit Idea" button - try multiple selectors
    const suggestIdeaButton = page
      .locator('button:has-text("Submit Idea")')
      .or(page.locator('button:has-text("Suggest an Idea")'))
      .or(page.getByRole("button", { name: /Suggest|Submit Idea/i }));
    await expect(suggestIdeaButton.first()).toBeVisible({ timeout: 10000 });
    await suggestIdeaButton.first().click();

    // Should navigate to suggest idea page
    await page.waitForURL("**/home/suggest-idea", { timeout: 15000 });
    // Wait for page content
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});
    await expect(
      page
        .locator("text=Suggest an Idea")
        .or(page.getByText(/Suggest an Idea/i))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("user can submit an idea suggestion", async ({ page }) => {
    // Navigate directly to suggest idea page
    await page.goto("/home/suggest-idea", { waitUntil: "domcontentloaded" });

    // Wait for form to load
    await page.waitForSelector('input[id="title"]', { timeout: 15000 });
    await page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => {});

    // Fill in the form
    await page.fill('input[id="title"]', "Add dark mode support");
    await page.fill(
      'textarea[id="description"]',
      "I would love to have a dark mode option for better visibility at night. This would improve the user experience significantly."
    );

    // Submit the form
    const submitButton = page
      .locator('button:has-text("Submit Idea")')
      .or(page.getByRole("button", { name: /Submit Idea/i }));
    await expect(submitButton.first()).toBeVisible({ timeout: 10000 });
    await submitButton.first().click();

    // Should show success message - wait for it to appear
    await page
      .waitForFunction(
        () => {
          const text = document.body.textContent || "";
          return (
            text.includes("Idea Submitted!") || text.includes("Idea Submitted")
          );
        },
        { timeout: 20000 }
      )
      .catch(() => {});

    // Check for success message with flexible selector
    const successMessage = page
      .locator("text=Idea Submitted!")
      .or(page.getByText(/Idea Submitted!/i))
      .or(page.locator('h2:has-text("Idea Submitted!")'));
    await expect(successMessage.first()).toBeVisible({ timeout: 15000 });

    // Should navigate back to profile after 2 seconds
    await page.waitForURL("**/home/profile", { timeout: 10000 });
  });

  test("form validation works correctly", async ({ page }) => {
    await page.goto("/home/suggest-idea");

    await page.waitForSelector('input[id="title"]', { timeout: 10000 });

    // Try to submit with short title
    await page.fill('input[id="title"]', "Test");
    await page.fill('textarea[id="description"]', "Short description");

    await page.locator('button:has-text("Submit Idea")').click();

    // Should show validation errors
    await expect(
      page.locator("text=Title must be at least 5 characters")
    ).toBeVisible();
    await expect(
      page.locator("text=Description must be at least 20 characters")
    ).toBeVisible();
  });
});
