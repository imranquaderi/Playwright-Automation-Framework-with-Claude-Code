import { test, expect } from '@playwright/test';
import { uniqueUsername } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Registration', () => {
  test('REG-03 password required', async ({ page }) => {
    await page.goto(routes.register);
    await page.locator('#username').fill(uniqueUsername());
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.passwordRequired))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
