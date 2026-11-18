import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, increaseBtn, itemQty, cartTotal, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.rapidClick;

test.describe('Cart', () => {
  test('CART-12 rapid double-click on + increments by exactly 2 and matches server', async ({ page }) => {
    test.fail(true, 'Defect: double-clicking "+" only increments once (lost update); server also stores the lower qty.');
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book); // qty 1

    await increaseBtn(page, PRODUCTS.book).dblclick();

    await expect(itemQty(page, PRODUCTS.book)).toHaveText(String(data.expectedQty), { timeout: 5_000 });
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);

    await page.reload();
    await expect(itemQty(page, PRODUCTS.book)).toHaveText(String(data.expectedQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
  });
});
