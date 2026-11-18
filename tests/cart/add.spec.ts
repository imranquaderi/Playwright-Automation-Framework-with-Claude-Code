import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, cartRow, cartRows, cartTotal, cartPanel, itemQty, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { labels } = testData;
const data = testData.suites.cart.add;

test.describe('Cart', () => {
  test('CART-02 logged-in user adds a product', async ({ page }) => {
    await newLoggedInUser(page);
    await expect(cartPanel(page)).toContainText(text(data.cartEmptyText));

    await addToCart(page, PRODUCTS.sofa);

    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(cartRow(page, PRODUCTS.sofa)).toContainText(data.unitPrice);
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.expectedQty));
    await expect(cartPanel(page)).toContainText(text(labels.orderTotal));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
    await expect(cartPanel(page).getByRole('button', { name: text(labels.checkout) })).toBeVisible();
    await expect(page.getByText(text(data.itemAlreadyInCartText))).toHaveCount(0);
  });
});
