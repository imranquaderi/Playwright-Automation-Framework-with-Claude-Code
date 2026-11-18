import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addToCart, decreaseBtn, cartRows, cartTotal, cartPanel, EMPTY_CART, PRODUCTS,
} from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { labels } = testData;

test.describe('Cart', () => {
  test('CART-06 quantity reaching zero removes the item', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);

    await decreaseBtn(page, PRODUCTS.sofa).click();

    await expect(cartRows(page)).toHaveCount(0);
    await expect(cartPanel(page)).toContainText(EMPTY_CART);
    await expect(cartTotal(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: text(labels.checkout) })).toHaveCount(0);
  });
});
