// full-flow.spec.ts
import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------
// Helper – creates a fresh account and lands on the Explore page.
// Every test calls this to ensure full independence.
// ---------------------------------------------------------------------
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

    // Navigate to explore with a logged‑in session
    await page.goto('http://localhost:3000/explore');
}

// ---------------------------------------------------------------------
// 1️⃣  Signup with valid data succeeds
// ---------------------------------------------------------------------
test('Signup with valid data succeeds', async ({ page }) => {
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
});

// ---------------------------------------------------------------------
// 2️⃣  Search for a stock and see results
// ---------------------------------------------------------------------
test('Search for a stock and see results', async ({ page }) => {
    await signupAndLogin(page);
    await expect(page).toHaveURL(/\/explore/);

    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');

    const appleCard = page.getByText('Apple Inc.').first();
    await expect(appleCard).toBeVisible();
});

// ---------------------------------------------------------------------
// 3️⃣  Toggle chart overlays (SMA 20/50, Bollinger Bands)
// ---------------------------------------------------------------------
test('Toggle chart overlays on/off', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);

    const sma20 = page.getByRole('checkbox', { name: /SMA 20/i });
    const sma50 = page.getByRole('checkbox', { name: /SMA 50/i });
    const bollinger = page.getByRole('checkbox', { name: /Bollinger Bands/i });

    // turn on
    await sma20.check(); await expect(sma20).toBeChecked();
    await sma50.check(); await expect(sma50).toBeChecked();
    await bollinger.check(); await expect(bollinger).toBeChecked();

    // turn off
    await sma20.uncheck(); await expect(sma20).not.toBeChecked();
    await sma50.uncheck(); await expect(sma50).not.toBeChecked();
    await bollinger.uncheck(); await expect(bollinger).not.toBeChecked();
});

// ---------------------------------------------------------------------
// 4️⃣  Toggle sub‑charts (MACD, Volume)
// ---------------------------------------------------------------------
test('Toggle sub‑charts on/off', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);

    const macdBtn = page.getByRole('button', { name: /MACD/i });
    const volumeBtn = page.getByRole('button', { name: /Volume/i });

    // turn on
    await macdBtn.click(); await expect(macdBtn).toHaveClass(/active/);
    await volumeBtn.click(); await expect(volumeBtn).toHaveClass(/active/);

    // turn off
    await macdBtn.click(); await expect(macdBtn).not.toHaveClass(/active/);
    await volumeBtn.click(); await expect(volumeBtn).not.toHaveClass(/active/);
});

// ---------------------------------------------------------------------
// 5️⃣  Generate AI recommendation on stock detail page
// ---------------------------------------------------------------------
test('Generate AI recommendation', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);

    const aiBtn = page.getByRole('button', { name: /AI Recommendation/i });
    await aiBtn.click();

    const aiResult = page.getByTestId('ai-recommendation-result');
    await expect(aiResult).toBeVisible();
});

// ---------------------------------------------------------------------
// 6️⃣  Ask AI chat a question and get a response
// ---------------------------------------------------------------------
test('Ask AI chat a question', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);

    const chatInput = page.getByPlaceholder('Ask AI');
    await chatInput.fill('What is the outlook for AAPL this year?');
    await chatInput.press('Enter');

    const chatResponse = page.getByTestId('ai-chat-response').first();
    await expect(chatResponse).toBeVisible();
});

// ---------------------------------------------------------------------
// 7️⃣  Trade/Buy a stock and confirm
// ---------------------------------------------------------------------
test('Buy a stock and confirm', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);

    const buyBtn = page.getByRole('button', { name: /Buy/i });
    await buyBtn.click();

    const toast = page.getByText(/Purchase successful/i);
    await expect(toast).toBeVisible();
});

// ---------------------------------------------------------------------
// 8️⃣  Portfolio shows the bought stock
// ---------------------------------------------------------------------
test('Portfolio reflects bought stock', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await page.getByRole('button', { name: /Buy/i }).click();

    await page.getByRole('link', { name: /Portfolio/i }).click();
    await expect(page).toHaveURL(/\/portfolio/);
    await expect(page.getByText('Apple Inc.')).toBeVisible();
});

// ---------------------------------------------------------------------
// 9️⃣  Download PDF summary from portfolio
// ---------------------------------------------------------------------
test('Download PDF from portfolio', async ({ page }) => {
    await signupAndLogin(page);
    await page.getByRole('link', { name: /Portfolio/i }).click();
    await expect(page).toHaveURL(/\/portfolio/);

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /Download PDF/i }).click(),
    ]);

    const path = await download.path();
    expect(path?.endsWith('.pdf')).toBeTruthy();
});

// ---------------------------------------------------------------------
// 🔟  Add stock to watchlist and verify it appears
// ---------------------------------------------------------------------
test('Add stock to watchlist', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();

    // first button on the detail page is the bookmark (watchlist) button
    const bookmarkBtn = page.getByRole('button').first();
    await bookmarkBtn.click();

    await page.getByRole('link', { name: /Watchlist/i }).click();
    await expect(page).toHaveURL(/\/watchlist/);
    await expect(page.getByText('Apple Inc.')).toBeVisible();
});

// ---------------------------------------------------------------------
// 1️⃣1️⃣  Navigate from watchlist to stock detail
// ---------------------------------------------------------------------
test('Navigate from watchlist to detail', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();
    await page.getByRole('button').first().click(); // add to watchlist

    await page.getByRole('link', { name: /Watchlist/i }).click();
    const watchItem = page.getByText('Apple Inc.');
    await watchItem.click();
    await expect(page).toHaveURL(/\/stock\/AAPL/);
});

// ---------------------------------------------------------------------
// 1️⃣2️⃣  Switch market (in/out) and verify UI updates
// ---------------------------------------------------------------------
test('Switch market and verify UI', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();

    // market switch inside the detail page
    await page.getByTestId('market-switch-in').click();

    // Apple should disappear and a different market card (e.g., RELIANCE.NS) appear
    await expect(page.getByText('Apple Inc.')).toBeHidden();
    const relianceCard = page.getByTestId('company-card-RELIANCE.NS');
    await expect(relianceCard).toBeVisible();
});

// ---------------------------------------------------------------------
// 1️⃣3️⃣  Generate Rating on a stock
// ---------------------------------------------------------------------
test('Generate rating on stock', async ({ page }) => {
    await signupAndLogin(page);
    const placeholder = 'Search Apple, Nvidia, Tesla, Microsoft...';
    await page.fill(`input[placeholder="${placeholder}"]`, 'Apple');
    await page.press(`input[placeholder="${placeholder}"]`, 'Enter');
    await page.getByText('Apple Inc.').first().click();

    const ratingBtn = page.getByRole('button', { name: /Generate Rating/i });
    await ratingBtn.click();

    const ratingResult = page.getByTestId('rating-result');
    await expect(ratingResult).toBeVisible();
});

// ---------------------------------------------------------------------
// 1️⃣4️⃣  Toggle theme (light/dark)
// ---------------------------------------------------------------------
test('Toggle theme', async ({ page }) => {
    await signupAndLogin(page);
    const themeToggle = page.getByRole('button', { name: /Toggle Theme/i });

    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await themeToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
});

// ---------------------------------------------------------------------
// 1️⃣5️⃣  Logout and verify redirect to login
// ---------------------------------------------------------------------
test('Logout redirects to login', async ({ page }) => {
    await signupAndLogin(page);
    await page.locator('button[title="Logout"]').click();
    await expect(page).toHaveURL(/\/login/);
});

// ---------------------------------------------------------------------
// 1️⃣6️⃣  Login with correct credentials succeeds
// ---------------------------------------------------------------------
test('Login with correct credentials succeeds', async ({ page }) => {
    // first create a fresh account
    await signupAndLogin(page);
    const email = await page
        .locator('input[placeholder="john@example.com"]')
        .inputValue();

    // logout → login
    await page.locator('button[title="Logout"]').click();
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
});

// ---------------------------------------------------------------------
// 1️⃣7️⃣  Login with wrong credentials shows error
// ---------------------------------------------------------------------
test('Login with wrong credentials shows error', async ({ page }) => {
    // create a fresh account
    await signupAndLogin(page);
    const email = await page
        .locator('input[placeholder="john@example.com"]')
        .inputValue();

    // logout → login with bad password
    await page.locator('button[title="Logout"]').click();
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'WrongPass123');
    await page.click('button:has-text("Sign In")');

    const error = page.locator('div:text-matches("invalid|incorrect", "i")');
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
});
