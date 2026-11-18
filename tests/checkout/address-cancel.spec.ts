import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, openAddressForm, addressInput, addressItems, NO_ADDRESSES,
  VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, exactText } from '../helpers/data';

const { labels } = testData;

test.describe('Checkout - addresses', () => {
  test('CHK-05 cancel add address', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);

    await openAddressForm(page);
    await addressInput(page).fill(VALID_ADDRESS);
    await page.getByRole('button', { name: exactText(labels.cancelButton) }).click();

    await expect(addressInput(page)).toHaveCount(0);
    await expect(addressItems(page)).toHaveCount(0);
    await expect(page.getByText(NO_ADDRESSES)).toBeVisible();
  });
});
