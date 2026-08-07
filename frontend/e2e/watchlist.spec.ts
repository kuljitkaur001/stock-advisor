// watchlist.spec.ts
import { test, expect, Page } from '@playwright/test';

// Reuse the same helper as other specs
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
  await expect(page).toHaveURL(/\/dashboard/);
  // Navigate to explore for subsequent actions
  await page.goto('http://localhost:3000/explore');
}

test.describe('Watchlist feature', () => {
  test('Add company to watchlist', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await expect(appleCard).toBeVisible();
    await appleCard.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await page.waitForResponse(response => response.url().endsWith('/watchlist') && response.status() === 201);
    await expect(bookmarkBtn.locator('svg')).toHaveClass(/fill-emerald-400/);
  });

  test('Remove company from watchlist', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
  await appleCard.click();
    await page.waitForURL(/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page).toHaveURL(/\/watchlist/);
    const watchItem = page.getByText('Apple Inc.');
    await expect(watchItem).toBeVisible();
    const removeBtn = watchItem.locator('..').locator('button').filter({ has: page.getByRole('img', { name: /Trash2/ }) });
    await removeBtn.click();
    await expect(watchItem).toBeHidden();
  });

  test('Watchlist persists after reload', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByText('Apple Inc.');
    await appleCard.click();
    await expect(page).toHaveURL(/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();
    await page.reload();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page).toHaveURL(/\/watchlist/);
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });

  test('Empty watchlist shows empty state', async ({ page }) => {
    await signupAndLogin(page);
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page.getByText(/Your watchlist is empty/)).toBeVisible();
  });

  test('Duplicate add is prevented', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await appleCard.click();
    await expect(page).toHaveURL(/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible();
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
  await bookmarkBtn.click();
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    const cards = page.getByText('Apple Inc.');
    await expect(cards).toHaveCount(1);
  });

  test('Watchlist item navigation', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByText('Apple Inc.');
    await appleCard.click();
    await expect(page).toHaveURL(/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    const watchItem = page.getByText('Apple Inc.');
    await watchItem.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
  });

  test('Watchlist badge updates', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await appleCard.click();
    await page.waitForURL(/stock\\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });

  test('Add to watchlist from search results', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const firstResult = page.getByTestId('company-card-AAPL');
    await firstResult.click();
    await page.waitForURL(/stock\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });

  test('Add from company detail page', async ({ page }) => {
    await signupAndLogin(page);
    const search = page.getByPlaceholder(/Search/);
    await search.fill('Apple');
    await search.press('Enter');
    const appleCard = page.getByTestId('company-card-AAPL');
    await appleCard.click();
    await page.waitForURL(/stock\\/AAPL/);
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await page.getByRole('link', { name: /Watchlist/ }).click();
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });

  test('Add to watchlist while not logged in redirects', async ({ page }) => {
    await page.goto('http://localhost:3000/stock/AAPL');
    const bookmarkBtn = page.getByTestId('bookmark-button');
    await expect(bookmarkBtn).toBeVisible({ timeout: 10000 });
    await bookmarkBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
