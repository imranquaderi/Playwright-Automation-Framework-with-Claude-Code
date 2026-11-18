import { expect, Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import { testData, text } from './data';

const { routes, labels, messages } = testData;

export const PASSWORD = testData.users.validUser.password;

/** Unique per call, so parallel tests across browsers never share an account on the live backend. */
export function uniqueUsername(): string {
  return `${testData.users.validUser.usernamePrefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

/** Registers a new user via the UI and leaves the page on /login. */
export async function registerUser(page: Page, username: string, password: string) {
  await page.goto(routes.register);
  await expect(page.getByRole('heading', { name: text(labels.registerHeading) })).toBeVisible();

  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.getByRole('button', { name: text(labels.registerButton) }).click();

  await expect(page.getByText(text(messages.registeredSuccessfully))).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${routes.login}$`));
}

/** Fills the login form (skipping empty fields) and submits. Caller must already be on /login. */
export async function login(page: Page, username: string, password: string) {
  if (username) await page.locator('#username').fill(username);
  if (password) await page.locator('#password').fill(password);
  await page.getByRole('button', { name: text(labels.loginButton) }).click();
}
