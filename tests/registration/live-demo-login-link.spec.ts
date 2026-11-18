// spec: specs/live_demo.md
// seed: tests/login.spec.ts

import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Registration - live demo', () => {
  test('"Login here" link goes to /login', async ({ page }) => {
    // 1. Go to /register and click the "Login here" link
    await page.goto(routes.register);
    await page.getByRole('link', { name: text(labels.loginLink) }).click();

    // 2. Expect /login with the "Login to QKart" button visible
    await expect(page).toHaveURL(urlEndsWith(routes.login));
    await expect(page.getByRole('button', { name: text(labels.loginButton) })).toBeVisible();
  });
});
