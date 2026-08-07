// company-directory.spec.ts
import { test, expect, Page } from '@playwright/test';

async function signupAndLogin(page: Page) {
  await page.goto('http://localhost:3000/signup');
  const email = `test-${Date.now()}@example.com`;
  const password = 'Test123!';
  const fullName = 'Test User';
  await page.fill('input[placeholder="John Doe"]', fullName);
  await page.fill('input[placeholder="john@example.com"]', email);
  await page.fill('input[placeholder="At least 6 characters"]', password);
  await page.getByRole('button', { name: /US/i }).first().click();
  await page.click('button:has-text("Register Account")');
  // Wait for navigation to dashboard after signup
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  // Navigate to explore with logged‑in session
  await page.goto('http://localhost:3000/explore');
}

test.describe('Company Directory (Stock Explorer) – comprehensive E2E', () => {
  // 1. Verify search finds a company
  test('Search for a company and see it appear', async ({ page }) => {
    await signupAndLogin(page);
    await expect(page).toHaveURL(/\/explore/);
    const searchInput = page.getByPlaceholder(/Search/);
    await searchInput.fill('Apple');
    await searchInput.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await expect(appleCard).toBeVisible();
  });

  // 2. Click a company card and verify navigation to detail page
  test('Click a company card and navigate to detail page', async ({ page }) => {
    await signupAndLogin(page);
    const searchInput = page.getByPlaceholder(/Search/);
    await searchInput.fill('Apple');
    await searchInput.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await expect(appleCard).toBeVisible();
    await appleCard.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
    await expect(page.getByRole('heading', { name: 'Apple Inc.' })).toBeVisible();
  });

  // 3. Verify detail page shows correct ticker and name
  test('Detail page displays correct company info', async ({ page }) => {
    await signupAndLogin(page);
    const searchInput = page.getByPlaceholder(/Search/);
    await searchInput.fill('Apple');
    await searchInput.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await expect(appleCard).toBeVisible();
    await appleCard.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
    await expect(page.getByRole('heading', { name: 'AAPL', exact: true })).toBeVisible();
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });

  // 4. Search for a nonexistent ticker and see no‑results state
  test('Search for nonexistent ticker shows no results', async ({ page }) => {
    await signupAndLogin(page);
    const searchInput = page.getByPlaceholder(/Search/);
    await searchInput.fill('ZZZZZZ');
    await searchInput.press('Enter');
    await expect(page.getByText(/No equities matched your query/)).toBeVisible();
  });

  // 5. Switch market after selecting a company and ensure previous data does not linger
  test('Market switch after selecting a company updates UI correctly', async ({ page }) => {
    await signupAndLogin(page);
    const searchInput = page.getByPlaceholder(/Search/);
    await searchInput.fill('Apple');
    await searchInput.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await expect(appleCard).toBeVisible();
    await appleCard.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
    await page.getByTestId('market-switch-in').click();
  // Ensure UI updates after market switch
  await page.waitForTimeout(500);
    await expect(page.getByTestId('company-card-AAPL')).toHaveCount(0);
    const relianceCard = page.getByTestId('company-card-RELIANCE.NS');
    await expect(relianceCard).toBeVisible();
  });
});
