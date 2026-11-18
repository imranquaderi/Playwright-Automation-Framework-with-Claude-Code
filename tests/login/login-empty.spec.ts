import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Login', () => {
  test('LOGIN-08 both fields empty', async ({ page }) => {
    await page.goto(routes.login);
    await page.getByRole('button', { name: text(labels.loginButton) }).click();

    // Username is validated first.
    await expect(page.getByText(text(messages.usernameRequired))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });
});
