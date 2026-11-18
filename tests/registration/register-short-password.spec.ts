import { test, expect } from '@playwright/test';
import { uniqueUsername } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.registration.registerShortPassword;

test.describe('Registration', () => {
  test('REG-05 password shorter than 6 characters', async ({ page }) => {
    await page.goto(routes.register);
    await page.locator('#username').fill(uniqueUsername());
    await page.locator('#password').fill(data.password);
    await page.locator('#confirmPassword').fill(data.password);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    // Toast says "at least"; the inline hint under the field says "atleast".
    await expect(page.getByText(text(messages.passwordTooShort))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
