import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, addAddress, placeOrderBtn, getStorage, VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;

test.describe('Checkout', () => {
  test('CHK-09 place order without selecting an address', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
    await addAddress(page, VALID_ADDRESS);

    await placeOrderBtn(page).click();

    await expect(page.getByText(text(messages.selectShippingAddress))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.checkout));
    expect((await getStorage(page)).balance).toBe(String(testData.users.validUser.initialBalance));
  });
});
