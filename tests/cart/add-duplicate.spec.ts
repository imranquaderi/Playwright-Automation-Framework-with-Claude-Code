import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, productCard, cartTotal, itemQty, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { labels, messages } = testData;
const data = testData.suites.cart.addDuplicate;

test.describe('Cart', () => {
  test('CART-03 adding the same product twice is rejected', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);

    await productCard(page, PRODUCTS.sofa).getByRole('button', { name: text(labels.addToCart) }).click();

    await expect(page.getByText(text(messages.itemAlreadyInCart))).toBeVisible();
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.expectedQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
  });
});
