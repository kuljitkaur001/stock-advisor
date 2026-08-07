// stock-data.spec.ts
import { test, expect, Page } from '@playwright/test';

async function signupAndLogin(page: Page) {
  await page.goto('/signup');
  const email = `test-${Date.now()}@example.com`;
  const password = 'Test123!';
  const fullName = 'Test User';
  await page.fill('input[placeholder="John Doe"]', fullName);
  await page.fill('input[placeholder="john@example.com"]', email);
  await page.fill('input[placeholder="At least 6 characters"]', password);
  await page.getByRole('button', { name: /US/i }).first().click();
  await page.click('button:has-text("Register Account")');
  await expect(page).toHaveURL(/\/dashboard/);
  // Now go to explore with logged-in session
  await page.goto('/explore');
}

test.describe('Stock Data Retrieval Flow', () => {
  test('Search Apple and view stock detail page', async ({ page }) => {
    await signupAndLogin(page);
    await expect(page).toHaveURL(/\/explore/);

    // Use the US market search placeholder
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder=\"${placeholder}\"]`, 'Apple');
    // Submit the search (press Enter)
    await page.press(`input[placeholder=\"${placeholder}\"]`, 'Enter');

    // Wait for results and click the Apple card
    const appleCard = page.locator('text=Apple Inc.').first();
    await expect(appleCard).toBeVisible();
    await appleCard.click();

    // Verify navigation to stock detail page
    await expect(page).toHaveURL(/\/stock\/AAPL/);
    // Verify the ticker heading is displayed
    const tickerHeader = page.locator('h1', { hasText: 'AAPL' });
    await expect(tickerHeader).toBeVisible();
    // Verify price element is visible (uses formatCurrency)
    const priceSpan = page.locator('span.text-2xl.font-bold.font-mono.text-slate-100');
    await expect(priceSpan).toBeVisible();
  });
});
