import { test, expect } from '@playwright/test';
import { newLoggedInUser, goToCheckout, addToCart, addAddress, addressItems, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.checkout.addressBoundary;

test.describe('Checkout - addresses', () => {
  test('CHK-04 address of exactly 20 characters is accepted (current behaviour)', async ({ page }) => {
    test.info().annotations.push({
      type: 'inconsistency',
      description: "Validation message says 'greater than 20 characters' but exactly 20 is accepted.",
    });
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);

    await addAddress(page, data.address);

    await expect(addressItems(page)).toHaveCount(data.expectedCount);
  });
});
