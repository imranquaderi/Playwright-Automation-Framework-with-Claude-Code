import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, setQty, itemQty, cartTotal, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.largeQty;

test.describe('Cart', () => {
  test('CART-11 cart with many units', async ({ page }) => {
    test.setTimeout(120_000);
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);

    await setQty(page, PRODUCTS.book, data.targetQty); // asserts each step increments by exactly one

    await expect(itemQty(page, PRODUCTS.book)).toHaveText(String(data.targetQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
    await expect(
      page.locator('#notistack-snackbar').filter({ hasText: new RegExp(data.errorToastPattern, 'i') }),
    ).toHaveCount(0);
  });
});
