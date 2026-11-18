import { test, expect } from '@playwright/test';
import { newLoggedInUser } from '../helpers/shop';
import { testData, urlEndsWith } from '../helpers/data';

const { routes } = testData;

test.describe('Order placement', () => {
  test('ORD-08 guest visiting /thanks is redirected to /', async ({ page }) => {
    await page.goto(routes.thanks);
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('ORD-08 logged-in user without an order visiting /thanks (exploratory)', async ({ page }) => {
    await newLoggedInUser(page);
    await page.goto(routes.thanks);

    // Record the behaviour; require that the app renders something (header) rather than a blank screen.
    await expect(page.locator('.header')).toBeVisible();
    test.info().annotations.push({ type: 'observed', description: `url=${page.url()}` });
  });
});
