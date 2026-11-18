// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, urlEndsWith } from '../helpers/data';

const { routes } = testData;

test.describe('Login - Happy Path', () => {
  test('Session is stored in localStorage after login', async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user and log in with valid credentials.
    await registerUser(page, username, PASSWORD);
    await login(page, username, PASSWORD);
    await expect(page).toHaveURL(urlEndsWith(routes.home));

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('username')))
      .toBe(username);
    const storage = await page.evaluate(() => ({
      token: localStorage.getItem('token'),
      balance: localStorage.getItem('balance'),
    }));
    expect(storage.token).toBeTruthy();
    expect(storage.balance).toBe(String(testData.users.validUser.initialBalance));
  });
});
