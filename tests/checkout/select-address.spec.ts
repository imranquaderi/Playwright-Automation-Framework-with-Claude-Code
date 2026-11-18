import { test, expect } from '@playwright/test';
import { newLoggedInUser, goToCheckout, addToCart, addAddress, addressItem, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.checkout.selectAddress;
const A1 = data.firstAddress;
const A2 = data.secondAddress;

test.describe('Checkout - addresses', () => {
  test('CHK-06 only one address can be selected at a time', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
    await addAddress(page, A1);
    await addAddress(page, A2);

    const r1 = addressItem(page, A1).locator('input[name="address"]');
    const r2 = addressItem(page, A2).locator('input[name="address"]');

    await r1.check();
    await expect(r1).toBeChecked();
    await expect(r2).not.toBeChecked();

    await r2.check();
    await expect(r2).toBeChecked();
    await expect(r1).not.toBeChecked();
  });
});
