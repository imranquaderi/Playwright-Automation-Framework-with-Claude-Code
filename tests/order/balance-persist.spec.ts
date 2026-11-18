import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addStandardCart, checkoutWithNewAddress, relogin, getStorage, cartPanel, cartRows, EMPTY_CART,
} from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.order.balancePersist;

test.describe('Order placement', () => {
  test('ORD-07 balance and empty cart survive logout/login', async ({ page }) => {
    test.setTimeout(90_000); // long flow incl. re-login against the live backend
    const username = await newLoggedInUser(page);
    await addStandardCart(page);
    await checkoutWithNewAddress(page);

    await relogin(page, username);

    await expect.poll(async () => (await getStorage(page)).balance).toBe(data.balanceAfterOrder);
    await expect(cartPanel(page)).toContainText(EMPTY_CART);
    await expect(cartRows(page)).toHaveCount(0);
  });
});
