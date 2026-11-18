import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, addAddress, addressItem, addressItems, openAddressForm, addressInput,
  PRODUCTS,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { labels, messages } = testData;
const data = testData.suites.checkout.addressLong;

const longText = (n: number) => (data.longAddressPrefix + data.longAddressFiller.repeat(n)).slice(0, n);

test.describe('Checkout - addresses', () => {
  test.beforeEach(async ({ page }) => {
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);
    await goToCheckout(page);
  });

  test('CHK-12 a 300-character address is rejected (max 128)', async ({ page }) => {
    await openAddressForm(page);
    await addressInput(page).fill(longText(data.tooLongLength));
    await page.getByRole('button', { name: exactText(labels.addAddressButton) }).click();

    await expect(page.getByText(text(messages.addressTooLong))).toBeVisible();
    await expect(addressItems(page)).toHaveCount(0);
  });

  test('CHK-12 a long (120-character) address renders without breaking the layout', async ({ page }) => {
    const address = longText(data.longLength);
    await addAddress(page, address);

    const item = addressItem(page, address);
    await expect(item.getByRole('button', { name: text(labels.delete) })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('CHK-12 unicode / HTML address is rendered as text, not executed', async ({ page }) => {
    const address = data.htmlAddress;
    let dialogFired = false;
    page.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });

    await addAddress(page, address);

    await expect(addressItem(page, data.htmlAddressFragment)).toContainText(data.htmlRenderedText);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(dialogFired).toBe(false);
  });
});
