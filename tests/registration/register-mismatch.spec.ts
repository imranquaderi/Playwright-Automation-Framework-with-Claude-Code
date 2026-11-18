import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, login } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.registration.registerMismatch;

test.describe('Registration', () => {
  test('REG-06 confirm password mismatch', async ({ page }) => {
    const username = uniqueUsername();
    await page.goto(routes.register);
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(data.mismatchedConfirmPassword);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.passwordsDoNotMatch))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));

    // No account must have been created.
    await page.goto(routes.login);
    await login(page, username, PASSWORD);
    await expect(page.getByText(text(messages.usernameDoesNotExist))).toBeVisible();
  });
});
