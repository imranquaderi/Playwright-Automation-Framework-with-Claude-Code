import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Registration', () => {
  test('REG-07 duplicate username rejected', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);

    await page.goto(routes.register);
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.usernameAlreadyExists))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
