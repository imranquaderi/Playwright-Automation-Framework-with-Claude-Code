import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, openCheckout, addAddress, selectAddress, placeOrderBtn, paymentText, getStorage, EMPTY_CART, VALID_ADDRESS,
} from '../helpers/shop';
import { testData, exactText, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.checkout.emptyCart;

test.describe('Checkout', () => {
  test('CHK-11 checkout with an empty cart (current behaviour)', async ({ page }) => {
    test.info().annotations.push({
      type: 'note',
      description: 'Checkout is reachable with an empty cart and PLACE ORDER is enabled once an address is selected.',
    });
    await newLoggedInUser(page);

    await openCheckout(page);
    await expect(paymentText(page, data.emptyTotal, testData.users.validUser.initialBalance)).toBeVisible();
    await expect(page.getByText(EMPTY_CART)).toBeVisible();

    await addAddress(page, VALID_ADDRESS);
    await selectAddress(page, VALID_ADDRESS);
    await expect(placeOrderBtn(page)).toBeEnabled();
    await placeOrderBtn(page).click();

    await expect(page.getByText(exactText(messages.cartIsEmpty))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.checkout));
    expect((await getStorage(page)).balance).toBe(String(testData.users.validUser.initialBalance));
  });
});
