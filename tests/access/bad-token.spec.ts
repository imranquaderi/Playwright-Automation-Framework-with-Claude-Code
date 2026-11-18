import { test, expect } from '@playwright/test';
import { newLoggedInUser, productCard, cartRows, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, labels } = testData;
const { tamperedToken, networkErrorPattern } = testData.suites.access.badToken;

test.describe('Access control', () => {
  test('ACL-04 tampered token is handled without a blank screen (exploratory)', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (e) => errors.push(e));
    await newLoggedInUser(page);

    await page.evaluate((token) => localStorage.setItem('token', token), tamperedToken);
    await page.reload();
    await expect(page.locator('.header')).toBeVisible();

    await page.goto(routes.checkout);
    await expect(page.locator('.header')).toBeVisible();
    test.info().annotations.push({ type: 'observed', description: `/checkout with bad token -> ${page.url()}` });

    await page.goto(routes.home);
    await productCard(page, PRODUCTS.book).getByRole('button', { name: text(labels.addToCart) }).click();
    // The item must not be added with an invalid token; some feedback (toast) should be shown.
    await expect(page.locator('#notistack-snackbar').first()).toBeVisible();
    test.info().annotations.push({
      type: 'observed',
      description: `add-to-cart toast="${await page.locator('#notistack-snackbar').first().innerText()}"`,
    });
    await expect(cartRows(page).filter({ hasText: PRODUCTS.book })).toHaveCount(0);

    // The backend's 401 lacks CORS headers, which WebKit surfaces as an uncaught XHR error.
    // That is a network-level symptom of the rejected token, not an app crash, so only record it.
    const networkError = new RegExp(networkErrorPattern, 'i');
    const isNetworkError = (e: Error) => networkError.test(e.message);
    for (const e of errors.filter(isNetworkError)) {
      test.info().annotations.push({ type: 'observed', description: `network error: ${e.message}` });
    }
    expect(errors.filter((e) => !isNetworkError(e))).toEqual([]);
  });
});
