import { test, expect } from '@playwright/test';
import { newLoggedInUser } from '../helpers/shop';
import { testData, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Header', () => {
  test('HDR-06 logo link returns to product listing', async ({ page }) => {
    await newLoggedInUser(page);
    await page.goto(routes.checkout);
    await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();

    await page.locator('.header-title a').click();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.locator('.card').first()).toBeVisible();
  });
});
