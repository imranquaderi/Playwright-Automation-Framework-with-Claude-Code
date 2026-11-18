import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.registration.registerBoundary;

const randomLetters = (n: number) =>
  Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');

test.describe('Registration', () => {
  test('REG-08 username and password of exactly 6 characters are accepted', async ({ page }) => {
    // 26^6 combinations, so collisions on the shared backend are negligible.
    const username = randomLetters(data.usernameLength);
    const password = data.password;

    await page.goto(routes.register);
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.registeredSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });
});
