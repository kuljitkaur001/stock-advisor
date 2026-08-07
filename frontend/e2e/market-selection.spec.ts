// market-selection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Market Selection Switcher', () => {
  test('Switch to Indian market updates dashboard text', async ({ page }) => {
    // Start from signup to have a logged-in session
    await page.goto('/signup');
    // Use fast signup flow (reuse previous email generation)
    const email = `test-${Date.now()}@example.com`;
    const password = 'Test123!';
    const fullName = 'Test User';
    await page.fill('input[placeholder="John Doe"]', fullName);
    await page.fill('input[placeholder="john@example.com"]', email);
    await page.fill('input[placeholder="At least 6 characters"]', password);
    await page.selectOption('select', 'IN');
    await page.click('button:has-text("Register Account")');
    await expect(page).toHaveURL(/\/dashboard/);
    // Verify dashboard shows Indian market text
    await expect(page.locator('text=Indian NSE')).toBeVisible();
    // Switch back to US market via Navbar
    await page.click('button:has-text("🇺🇸 US")');
    await expect(page.locator('text=US Markets')).toBeVisible();
  });
});
