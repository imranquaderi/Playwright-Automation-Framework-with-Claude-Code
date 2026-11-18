import { test, expect } from '@playwright/test';
import { PASSWORD } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.registration.registerShortUsername;

test.describe('Registration', () => {
  test('REG-04 username shorter than 6 characters', async ({ page }) => {
    await page.goto(routes.register);
    await page.locator('#username').fill(data.username);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.usernameTooShort))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
