// spec: specs/live_demo.md
// seed: tests/login.spec.ts

import { test, expect } from '@playwright/test';
import { uniqueUsername } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

const dataSets = [
  { label: 'minimum length password', password: 'abc123' },
  { label: 'password with special characters', password: 'Test@1234' },
];

test.describe('Registration - live demo', () => {
  for (const data of dataSets) {
    test(`successful registration with ${data.label}`, async ({ page }) => {
      // 1. Go to /register, fill the form and click "Register Now"
      await page.goto(routes.register);
      await page.locator('#username').fill(uniqueUsername());
      await page.locator('#password').fill(data.password);
      await page.locator('#confirmPassword').fill(data.password);
      await page.getByRole('button', { name: text(labels.registerButton) }).click();

      // 2. Expect the success toast and redirect to /login
      await expect(page.getByText(text(messages.registeredSuccessfully))).toBeVisible();
      await expect(page).toHaveURL(urlEndsWith(routes.login));
    });
  }
});
