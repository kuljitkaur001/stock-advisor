// auth.spec.ts
// import { test, expect } from '@playwright/test';
import { test, expect, Page } from '@playwright/test';

function generateEmail() {
  const ts = Date.now();
  return `test-${ts}@example.com`;
}

async function signup(page: Page, email: string) {

  const password = 'Test123!';
  const fullName = 'Test User';
  const country = 'US';
  await page.goto('http://localhost:3000/signup');
  await expect(page).toHaveURL(/\/signup/);
  await page.fill('input[placeholder="John Doe"]', fullName);
  await page.fill('input[placeholder="john@example.com"]', email);
  await page.fill('input[placeholder="At least 6 characters"]', password);
  // Select country via button group
  await page.getByRole('button', { name: /US/i }).first().click();
  await page.click('button:has-text("Register Account")');


  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}


test.describe('Authentication Flow', () => {
  test('Signup with a new unique email succeeds', async ({ page }) => {
    const email = generateEmail();
    await signup(page, email);
    // Store email for later tests via test.info().project.use if needed
  });

  test('Signup with an already-used email shows validation error', async ({ page }) => {
    const email = generateEmail();
    const password = 'Test123!';
    const fullName = 'Test User';
    const country = 'US';
    // First successful signup
    await signup(page, email);
    // Attempt to signup again with same email
    await page.goto('http://localhost:3000/signup');
    await page.fill('input[placeholder="John Doe"]', fullName);
    await page.fill('input[placeholder="john@example.com"]', email);
    await page.fill('input[placeholder="At least 6 characters"]', password);
    await page.selectOption('select', country);
    await page.click('button:has-text("Register Account")');

    const error = page.locator('div:text-matches("already", "i")');
    await expect(error).toBeVisible();
  });

  test('Login with correct credentials succeeds', async ({ page }) => {
    const email = generateEmail();
    // Ensure user exists
    await signup(page, email);
    // Log out to get to login page
    await page.locator('button[title="Logout"]').click();
    await expect(page).toHaveURL(/\/login/);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Test123!');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Login with wrong password fails with visible error', async ({ page }) => {
    const email = generateEmail();
    await signup(page, email);
    await page.locator('button[title="Logout"]').click();
    await expect(page).toHaveURL(/\/login/);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'WrongPass123');
    await page.click('button:has-text("Sign In")');
    const error = page.locator('div:text-matches("invalid|incorrect", "i")');
    await expect(error).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    const email = generateEmail();
    await signup(page, email);
    await page.locator('button[title="Logout"]').click();
    // duplicate logout removed
    await expect(page).toHaveURL(/\/login/);
    // Attempt to access dashboard again should redirect to login
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // test('Forgot Password flow reaches confirmation', async ({ page }) => {
  //   const email = generateEmail();
  //   await signup(page, email);
  //   await page.locator('button[title="Logout"]').click();
  //   await expect(page).toHaveURL(/\/login/);
  //   const forgotLink = page.getByRole('link', { name: /Forgot password\?$/i });
  //   await forgotLink.click();
  //   await expect(page).toHaveURL(/\/forgot-password/);
  //   await page.fill('input[type="email"]', email);
  //   await page.click('button:has-text("Submit")');
  //   const confirmation = page.locator('text=Password reset email sent');
  //   await expect(confirmation).toBeVisible();
  // });
});
