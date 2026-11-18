import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from './helpers/auth';
import { testData, text, urlEndsWith } from './helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.root.login;

test.describe('QKart - Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.login);
  });

  test('displays the login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: text(labels.loginHeading) })).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: text(labels.loginButton) })).toBeEnabled();
    await expect(page.getByRole('link', { name: text(labels.registerButton) })).toBeVisible();
  });

  test('logs in successfully with valid credentials', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);

    await login(page, username, PASSWORD);

    await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.getByText(username)).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();

    // Session details are persisted in localStorage after login
    const storage = await page.evaluate(() => ({
      username: localStorage.getItem('username'),
      token: localStorage.getItem('token'),
      balance: localStorage.getItem('balance'),
    }));
    expect(storage.username).toBe(username);
    expect(storage.token).toBeTruthy();
    expect(storage.balance).toBeTruthy();
  });

  test('shows an error for an incorrect password', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);

    await login(page, username, data.wrongPassword);

    await expect(page.getByText(text(messages.passwordIncorrect))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('shows an error for a username that does not exist', async ({ page }) => {
    await login(page, uniqueUsername(), PASSWORD);

    await expect(page.getByText(text(messages.usernameDoesNotExist))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('requires a username', async ({ page }) => {
    await login(page, '', PASSWORD);

    await expect(page.getByText(text(messages.usernameRequired))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('requires a password', async ({ page }) => {
    await login(page, uniqueUsername(), '');

    await expect(page.getByText(text(messages.passwordRequired))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('navigates to the register page via "Register now"', async ({ page }) => {
    await page.getByRole('link', { name: text(labels.registerButton) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });

  test('logs out and clears the session', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);
    await login(page, username, PASSWORD);
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();

    await page.getByRole('button', { name: text(labels.logoutButton) }).click();

    await expect(page.getByRole('button', { name: text(labels.headerLoginButton) })).toBeVisible();
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
