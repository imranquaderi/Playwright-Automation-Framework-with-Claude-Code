import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addStandardCart, checkoutWithNewAddress, addToCart, setQty, cartTotal, goToCheckout,
  addressItem, selectAddress, placeOrderBtn, paymentText, getStorage, VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.order.secondOrder;

test.describe('Order placement', () => {
  test('ORD-06 second order uses the reduced balance', async ({ page }) => {
    test.setTimeout(120_000);
    await newLoggedInUser(page);
    await addStandardCart(page);
    await checkoutWithNewAddress(page);
    await page.getByRole('button', { name: text(labels.continueShopping) }).click();
    await expect(page).toHaveURL(urlEndsWith(routes.home));

    await addToCart(page, PRODUCTS.sofa);
    await setQty(page, PRODUCTS.sofa, data.sofaQty);
    await expect(cartTotal(page)).toHaveText(data.cartTotal);

    await goToCheckout(page);
    await expect(paymentText(page, data.orderTotal, data.walletBalance)).toBeVisible();
    await expect(addressItem(page, VALID_ADDRESS)).toBeVisible(); // saved from the first order
    await selectAddress(page, VALID_ADDRESS);
    await placeOrderBtn(page).click();

    await expect(page.getByText(text(messages.insufficientBalance))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.checkout));
    expect((await getStorage(page)).balance).toBe(data.balanceAfterFailure);
  });
});
