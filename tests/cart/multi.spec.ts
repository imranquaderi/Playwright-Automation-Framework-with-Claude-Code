import { test, expect } from '@playwright/test';
import { newLoggedInUser, addStandardCart, cartRows, cartTotal } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.multi;

test.describe('Cart', () => {
  test('CART-07 multiple products total', async ({ page }) => {
    await newLoggedInUser(page);

    await addStandardCart(page); // Sofa + Thinking, Fast and Slow + Roadster

    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(cartTotal(page)).toHaveText(testData.cart.standardCartTotal);
  });
});
