import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, increaseBtn, itemQty, cartRow, cartTotal, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.increase;

test.describe('Cart', () => {
  test('CART-04 increase quantity updates line and total', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);

    await increaseBtn(page, PRODUCTS.sofa).click();

    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.expectedQty));
    await expect(cartRow(page, PRODUCTS.sofa)).toContainText(data.unitPrice); // unit price unchanged
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
  });
});
