import { test, expect } from '@playwright/test';
import { newLoggedInUser, addStandardCart, checkoutWithNewAddress, getStorage } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.order.placeOrder;

test.describe('Order placement', () => {
  test('ORD-01 place order successfully', async ({ page }) => {
    await newLoggedInUser(page);
    await addStandardCart(page); // $695

    await checkoutWithNewAddress(page); // asserts toast + /thanks

    await expect.poll(async () => (await getStorage(page)).balance).toBe(data.balanceAfterOrder);
  });
});
