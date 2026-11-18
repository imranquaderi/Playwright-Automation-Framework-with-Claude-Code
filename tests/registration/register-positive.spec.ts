// spec: registration positive flow (2 data sets)
// seed: tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { login, registerUser, uniqueUsername } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;

test.describe('Registration - positive flow', () => {
  for (const data of [
    { label: 'minimum length password', password: 'abc123' },
    { label: 'password with special characters', password: 'Test@1234' },
  ]) {
    test(`registers successfully and can log in with valid data (${data.label})`, async ({ page }) => {
      const username = uniqueUsername();

      // 1. Go to /register, fill the form, click "Register Now"
      // (registerUser also asserts the "registered successfully" toast and the /login URL)
      await registerUser(page, username, data.password);
      await expect(page.getByText(text(messages.registeredSuccessfully))).toBeVisible();
      await expect(page).toHaveURL(urlEndsWith(routes.login));

      // 2. Log in with the same credentials
      await login(page, username, data.password);
      await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('username')))
        .toBe(username);
    });
  }
});
