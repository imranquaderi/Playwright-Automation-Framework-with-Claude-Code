import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, increaseBtn, decreaseBtn, itemQty, cartTotal, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.decrease;

test.describe('Cart', () => {
  test('CART-05 decrease quantity', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);

    await increaseBtn(page, PRODUCTS.sofa).click();
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.increasedQty));

    await decreaseBtn(page, PRODUCTS.sofa).click();
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.decreasedQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
  });
});
