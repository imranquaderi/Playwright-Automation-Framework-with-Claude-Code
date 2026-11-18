import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, addAddress, addressItem, addressItems, placeOrderBtn,
  NO_ADDRESSES, PRODUCTS,
} from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { labels } = testData;
const data = testData.suites.checkout.deleteAddress;
const A1 = data.firstAddress;
const A2 = data.secondAddress;

test.describe('Checkout - addresses', () => {
  test('CHK-07 delete an address', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
    await addAddress(page, A1);
    await addAddress(page, A2);

    await addressItem(page, A2).getByRole('button', { name: text(labels.delete) }).click();
    // UI update is asynchronous; the web-first assertion waits for it.
    await expect(addressItem(page, A2)).toHaveCount(0);
    await expect(addressItem(page, A1)).toBeVisible();

    await page.reload();
    await expect(addressItem(page, A1)).toBeVisible();
    await expect(addressItems(page)).toHaveCount(data.remainingCount);

    await addressItem(page, A1).getByRole('button', { name: text(labels.delete) }).click();
    await expect(addressItems(page)).toHaveCount(0);
    await expect(page.getByText(NO_ADDRESSES)).toBeVisible();
    await expect(placeOrderBtn(page)).toBeDisabled();
  });
});
