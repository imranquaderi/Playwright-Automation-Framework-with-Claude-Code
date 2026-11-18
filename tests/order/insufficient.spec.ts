import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addToCart, setQty, cartTotal, goToCheckout, addAddress, selectAddress, placeOrderBtn,
  paymentText, getStorage, itemQty, VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.order.insufficient;

test.describe('Order placement', () => {
  test('ORD-04 insufficient wallet balance', async ({ page }) => {
    test.setTimeout(90_000);
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);
    await setQty(page, PRODUCTS.sofa, data.sofaQty);
    await expect(cartTotal(page)).toHaveText(data.cartTotal);

    await goToCheckout(page);
    await expect(paymentText(page, data.orderTotal, data.walletBalance)).toBeVisible();
    await addAddress(page, VALID_ADDRESS);
    await selectAddress(page, VALID_ADDRESS);
    await placeOrderBtn(page).click();

    await expect(page.getByText(text(messages.insufficientBalance))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.checkout));
    expect((await getStorage(page)).balance).toBe(data.balanceAfterFailure);

    // Cart is retained.
    await page.goto(routes.home);
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(data.retainedQty);
    await expect(cartTotal(page)).toHaveText(data.cartTotal);
  });
});
