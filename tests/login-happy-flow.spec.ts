import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from './helpers/auth';
import { testData, text, exactText, urlEndsWith } from './helpers/data';

const { routes, labels, messages } = testData;

/**
 * Happy flow: a newly registered user logs in to QKart.
 *
 * Flow and assertions were recorded against the live QA site with the
 * Playwright MCP browser:
 *   /register -> "Registered Successfully" toast -> redirected to /login
 *   /login    -> "Logged in successfully" toast  -> redirected to /
 *   header shows username + Logout; localStorage holds username/token/balance (5000 for new users)
 */

test.describe('QKart - Login happy flow', () => {
  test('registered user can log in and lands on the products page', async ({ page }) => {
    const username = uniqueUsername();

    await test.step('Register a fresh user', async () => {
      await registerUser(page, username, PASSWORD);
    });

    await test.step('Log in with valid credentials', async () => {
      await expect(page.getByRole('heading', { name: text(labels.loginHeading) })).toBeVisible();
      await login(page, username, PASSWORD);

      await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
    });

    await test.step('Verify the logged-in landing page', async () => {
      await expect(page).toHaveURL(urlEndsWith(routes.home));
      await expect(page.getByRole('img', { name: username })).toBeVisible();
      await expect(page.getByText(username, { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
      await expect(page.getByRole('textbox', { name: text(labels.searchPlaceholder) }).first()).toBeVisible();
      // Login/Register buttons are replaced by the user section once logged in
      await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toHaveCount(0);
      await expect(page.getByRole('button', { name: exactText(labels.headerRegisterButton) })).toHaveCount(0);
    });

    await test.step('Verify session is persisted in localStorage', async () => {
      const storage = await page.evaluate(() => ({
        username: localStorage.getItem('username'),
        token: localStorage.getItem('token'),
        balance: localStorage.getItem('balance'),
      }));
      expect(storage.username).toBe(username);
      expect(storage.token).toBeTruthy();
      expect(storage.balance).toBe(String(testData.users.validUser.initialBalance));
    });
  });
});
