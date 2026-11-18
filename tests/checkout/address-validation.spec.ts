import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, openAddressForm, addressInput, addressItems, PRODUCTS,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { labels, messages } = testData;
const data = testData.suites.checkout.addressValidation;

test.describe('Checkout - addresses', () => {
  for (const { label, value } of data.invalidAddresses) {
    test(`CHK-03 address validation rejects ${label}`, async ({ page }) => {
      await newLoggedInUser(page);
      await addToCart(page, PRODUCTS.book);
      await goToCheckout(page);
      await openAddressForm(page);

      await addressInput(page).fill(value);
      await page.getByRole('button', { name: exactText(labels.addAddressButton) }).click();

      await expect(page.getByText(text(messages.addressTooShort))).toBeVisible();
      await expect(addressItems(page)).toHaveCount(0);
      await expect(addressInput(page)).toBeVisible();
    });
  }
});
