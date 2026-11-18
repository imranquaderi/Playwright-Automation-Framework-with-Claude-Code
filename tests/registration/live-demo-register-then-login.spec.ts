// spec: specs/live_demo.md
// seed: tests/login.spec.ts

import { test, expect } from '@playwright/test';
import { uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text } from '../helpers/data';

const { messages } = testData;

const dataSets = [
  { label: 'minimum length password', password: 'abc123' },
  { label: 'password with special characters', password: 'Test@1234' },
];

test.describe('Registration - live demo', () => {
  for (const data of dataSets) {
    test(`newly registered user can log in with ${data.label}`, async ({ page }) => {
      // 1. Register a fresh user (helper checks toast and /login redirect)
      const username = uniqueUsername();
      await registerUser(page, username, data.password);

      // 2. Log in with the same credentials
      await login(page, username, data.password);
      await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();

      // 3. Session is stored in localStorage
      await expect.poll(() => page.evaluate(() => localStorage.getItem('username'))).toBe(username);
      await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeTruthy();
    });
  }
});
