// spec: specs/Demo_1611.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Login - Happy Path', () => {
  test('Log in with valid credentials', async ({ page }) => {
    const username = uniqueUsername();

    // 1. Register a new user with a unique username and password 'abcdef'.
    await registerUser(page, username, PASSWORD);
    await expect(page.getByRole('heading', { name: text(labels.loginHeading) })).toBeVisible();

    // 2. Fill #username and #password. Click 'Login to QKart'.
    await login(page, username, PASSWORD);
    await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
  });
});
