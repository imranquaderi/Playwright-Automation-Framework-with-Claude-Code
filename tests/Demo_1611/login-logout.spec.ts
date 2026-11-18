// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Login - Happy Path', () => {
  test('Log out after a successful login', async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user and log in with valid credentials.
    await registerUser(page, username, PASSWORD);
    await login(page, username, PASSWORD);
    await expect(page).toHaveURL(urlEndsWith(routes.home));

    // 2. Click 'Logout'.
    await page.getByRole('button', { name: text(labels.logoutButton) }).click();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('token')))
      .toBeNull();
  });
});
