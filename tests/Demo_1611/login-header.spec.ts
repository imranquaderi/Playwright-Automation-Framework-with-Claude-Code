// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Login - Happy Path', () => {
  test("Logged-in header shows the user's details", async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user and log in with valid credentials.
    await registerUser(page, username, PASSWORD);
    await login(page, username, PASSWORD);
    await expect(page).toHaveURL(urlEndsWith(routes.home));

    await expect(page.getByRole('img', { name: username })).toBeVisible();
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toHaveCount(0);
    await expect(page.getByRole('button', { name: exactText(labels.headerRegisterButton) })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: text(labels.searchPlaceholder) }).first()).toBeVisible();
  });
});
