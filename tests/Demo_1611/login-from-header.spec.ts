// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Login - Happy Path', () => {
  test('Log in starting from the products page header', async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user, then go to / as a guest.
    await registerUser(page, username, PASSWORD);
    await page.goto(routes.home);
    const headerLogin = page.getByRole('button', { name: exactText(labels.headerLoginButton) });
    await expect(headerLogin).toBeVisible();
    await expect(page.getByRole('button', { name: exactText(labels.headerRegisterButton) })).toBeVisible();

    // 2. Click the header 'Login' button.
    await headerLogin.click();
    await expect(page).toHaveURL(urlEndsWith(routes.login));

    // 3. Log in with the new user's credentials.
    await login(page, username, PASSWORD);
    await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.getByText(username, { exact: true })).toBeVisible();
  });
});
