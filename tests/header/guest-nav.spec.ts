import { test, expect } from '@playwright/test';
import { testData, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Header', () => {
  test('HDR-03 header Login button navigates to /login', async ({ page }) => {
    await page.goto(routes.home);
    await page.getByRole('button', { name: exactText(labels.headerLoginButton) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('HDR-03 header Register button navigates to /register', async ({ page }) => {
    await page.goto(routes.home);
    await page.getByRole('button', { name: exactText(labels.headerRegisterButton) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.register));
  });
});
