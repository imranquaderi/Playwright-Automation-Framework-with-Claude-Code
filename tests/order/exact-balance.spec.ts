import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addToCart, setQty, cartTotal, goToCheckout, addAddress, selectAddress, placeOrderBtn,
  paymentText, getStorage, VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.order.exactBalance;

test.describe('Order placement', () => {
  test('ORD-05 order total exactly equal to wallet balance succeeds', async ({ page }) => {
    test.setTimeout(120_000);
    await newLoggedInUser(page);

    // 7 x $650 + 3 x $100 + $120 + $30 = $5000
    await addToCart(page, PRODUCTS.sofa);
    await setQty(page, PRODUCTS.sofa, data.sofaQty);
    await addToCart(page, PRODUCTS.racquet);
    await setQty(page, PRODUCTS.racquet, data.racquetQty);
    await addToCart(page, PRODUCTS.jenga);
    await addToCart(page, PRODUCTS.roadster);
    await expect(cartTotal(page)).toHaveText(data.cartTotal);

    await goToCheckout(page);
    await expect(paymentText(page, data.orderTotal, data.walletBalance)).toBeVisible();
    await addAddress(page, VALID_ADDRESS);
    await selectAddress(page, VALID_ADDRESS);
    await placeOrderBtn(page).click();

    await expect(page.getByText(text(messages.orderPlacedSuccessfully))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.thanks));
    await expect.poll(async () => (await getStorage(page)).balance).toBe(data.balanceAfterOrder);
  });
});
