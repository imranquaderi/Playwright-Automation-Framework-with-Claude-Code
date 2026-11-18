import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, openCheckout, goToCheckout, addToCart, addAddress, addressItem, relogin, VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';

test.describe('Checkout - addresses', () => {
  test('CHK-08 addresses persist across reload and logout/login', async ({ page }) => {
    const username = await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
    await addAddress(page, VALID_ADDRESS);

    await page.reload();
    await expect(addressItem(page, VALID_ADDRESS)).toBeVisible();

    await relogin(page, username);
    await openCheckout(page);
    await expect(addressItem(page, VALID_ADDRESS)).toBeVisible();
  });
});
