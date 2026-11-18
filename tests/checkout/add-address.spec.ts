import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addToCart, goToCheckout, openAddressForm, addressInput, addressItem, placeOrderBtn,
  VALID_ADDRESS, PRODUCTS,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { labels } = testData;

test.describe('Checkout - addresses', () => {
  test('CHK-02 add a valid address', async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
    await expect(placeOrderBtn(page)).toBeDisabled();

    await openAddressForm(page);
    await expect(page.getByRole('button', { name: exactText(labels.addAddressButton) })).toBeVisible();
    await expect(page.getByRole('button', { name: exactText(labels.cancelButton) })).toBeVisible();

    await addressInput(page).fill(VALID_ADDRESS);
    await page.getByRole('button', { name: exactText(labels.addAddressButton) }).click();

    const item = addressItem(page, VALID_ADDRESS);
    await expect(item).toBeVisible();
    await expect(item.locator('input[name="address"]')).not.toBeChecked();
    await expect(item.getByRole('button', { name: text(labels.delete) })).toBeVisible();
    await expect(addressInput(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: text(labels.addNewAddress) })).toBeVisible();
    await expect(placeOrderBtn(page)).toBeEnabled();
  });
});
