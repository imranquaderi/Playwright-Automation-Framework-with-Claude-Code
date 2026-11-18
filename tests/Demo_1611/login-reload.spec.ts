// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

const readStorage = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    username: localStorage.getItem('username'),
    token: localStorage.getItem('token'),
    balance: localStorage.getItem('balance'),
  }));

test.describe('Login - Happy Path', () => {
  test('Session persists after page reload', async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user and log in with valid credentials.
    await registerUser(page, username, PASSWORD);
    await login(page, username, PASSWORD);
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    const before = await readStorage(page);

    // 2. Reload the page.
    await page.reload();
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
    expect(await readStorage(page)).toEqual(before);
  });
});
