import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername } from '../helpers/auth';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Registration', () => {
  test('REG-01 register with valid details', async ({ page }) => {
    await page.goto(routes.register);
    await expect(page.getByRole('heading', { name: text(labels.registerHeading) })).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.registerButton) })).toBeVisible();
    await expect(page.getByRole('link', { name: text(labels.loginLink) })).toHaveAttribute('href', urlEndsWith(routes.login));
    await expect(page.getByText(text(labels.alreadyHaveAccount))).toBeVisible();
    await expect(page.getByText(text(messages.passwordHint))).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.backToExplore) })).toBeVisible();

    await page.locator('#username').fill(uniqueUsername());
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    await expect(page.getByText(text(messages.registeredSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
