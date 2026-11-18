import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Registration', () => {
  test('REG-02 empty form shows username required', async ({ page }) => {
    await page.goto(routes.register);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.usernameRequired))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
