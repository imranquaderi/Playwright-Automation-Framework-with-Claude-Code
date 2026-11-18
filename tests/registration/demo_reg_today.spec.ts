// spec: specs/demo_today.md
// seed: tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { login, registerUser, uniqueUsername } from '../helpers/auth';
import { testData, text } from '../helpers/data';

const { messages } = testData;

test.describe('demo_reg_today', () => {
  for (const data of [
    { label: 'minimum length password', password: 'abc123' },
    { label: 'password with special characters', password: 'Test@1234' },
  ]) {
    test(`demo_reg_today (${data.label})`, async ({ page }) => {
      const username = uniqueUsername();

      // 1. Go to /register, fill the form, click "Register Now"
      // (registerUser already asserts the "registered successfully" toast and the /login URL)
      await registerUser(page, username, data.password);
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('token')))
        .toBeNull();

      // 2. Log in with the same credentials
      await login(page, username, data.password);
      await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('username')))
        .toBe(username);
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem('token')))
        .toBeTruthy();
    });
  }
});
