import { test, expect } from '@playwright/test';
import { newLoggedInUser, addStandardCart, checkoutWithNewAddress, cartPanel, cartRows, EMPTY_CART } from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Order placement', () => {
  test('ORD-03 Continue Shopping returns to products with an empty cart', async ({ page }) => {
    const username = await newLoggedInUser(page);
    await addStandardCart(page);
    await checkoutWithNewAddress(page);

    await page.getByRole('button', { name: text(labels.continueShopping) }).click();

    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(cartPanel(page)).toContainText(EMPTY_CART);
    await expect(cartRows(page)).toHaveCount(0);
    await expect(page.locator('.username-text')).toHaveText(username);
  });
});
