import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Registration', () => {
  test('REG-09 navigation links on register page', async ({ page }) => {
    await page.goto(routes.register);
    await page.getByRole('link', { name: text(labels.loginLink) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.login));

    await page.goBack();
    await expect(page).toHaveURL(urlEndsWith(routes.register));

    await page.getByRole('button', { name: text(labels.backToExplore) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.locator('.card').first()).toBeVisible();
  });
});
