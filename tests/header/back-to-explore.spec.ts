import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Header', () => {
  for (const path of [routes.login, routes.register]) {
    test(`HDR-04 Back to explore on ${path} returns to products`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole('button', { name: text(labels.backToExplore) }).click();
      await expect(page).toHaveURL(urlEndsWith(routes.home));
      await expect(page.locator('.card').first()).toBeVisible();
    });
  }
});
