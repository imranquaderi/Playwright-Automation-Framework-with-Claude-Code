// spec: OrangeHRM Login - Positive
// seed: tests/seed.spec.ts

import { test, expect as baseExpect, type Page } from '@playwright/test';

// The public OrangeHRM demo is slow; allow more time than the 5s default.
const expect = baseExpect.configure({ timeout: 20_000 });
test.describe.configure({ timeout: 60_000 });

const LOGIN_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login';
const USERNAME = 'Admin';
const PASSWORD = 'admin123';

async function openLoginAndFill(page: Page) {
  await page.goto(LOGIN_URL);
  await page.getByPlaceholder('Username').fill(USERNAME);
  await page.getByPlaceholder('Password').fill(PASSWORD);
}

async function login(page: Page) {
  await openLoginAndFill(page);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/dashboard\/index/);
}

test.describe('OrangeHRM Login - Positive', () => {
  test('logs in with valid credentials using the Login button', async ({ page }) => {
    // 1. Open login page, fill credentials, click Login
    await openLoginAndFill(page);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('img', { name: 'profile picture' })).toBeVisible();
  });

  test('logs in with valid credentials by pressing Enter', async ({ page }) => {
    // 1. Open login page, fill credentials, press Enter in the password field
    await openLoginAndFill(page);
    await page.getByPlaceholder('Password').press('Enter');

    await expect(page).toHaveURL(/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('keeps the user logged in after a page reload', async ({ page }) => {
    // 1. Log in with valid credentials
    await login(page);

    // 2. Reload the page
    await page.reload();

    await expect(page).toHaveURL(/dashboard\/index/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('logs out successfully after a valid login', async ({ page }) => {
    // 1. Log in with valid credentials
    await login(page);

    // 2. Open the user profile dropdown
    await page.getByRole('banner').getByRole('img', { name: 'profile picture' }).click();

    // 3. Click Logout
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/auth\/login/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('Username')).toBeVisible();
  });
});
