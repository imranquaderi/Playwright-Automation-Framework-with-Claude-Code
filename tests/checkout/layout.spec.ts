import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, addStandardCart, goToCheckout, paymentText, placeOrderBtn, NO_ADDRESSES, PRODUCTS,
} from '../helpers/shop';
import { testData, text, fill } from '../helpers/data';

const { labels } = testData;
const data = testData.suites.checkout.layout;

test.describe('Checkout', () => {
  test('CHK-01 checkout page layout for a new user', async ({ page }) => {
    await newLoggedInUser(page);
    await addStandardCart(page);

    await goToCheckout(page);

    await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();
    await expect(page.getByRole('heading', { name: labels.paymentHeading })).toBeVisible();
    await expect(page.getByText(NO_ADDRESSES)).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.addNewAddress) })).toBeVisible();
    await expect(paymentText(page, data.paymentTotal, testData.users.validUser.initialBalance)).toBeVisible();
    await expect(placeOrderBtn(page)).toBeDisabled();

    const items = page.locator('.cart').first();
    const productNames = data.cartProducts.map((key) => PRODUCTS[key as keyof typeof PRODUCTS]);
    for (const name of productNames) {
      await expect(items.getByText(name)).toBeVisible();
    }
    await expect(items.getByText(fill(labels.cartItemQty, { qty: data.itemQty }))).toHaveCount(productNames.length);

    const details = page.locator('.cart').filter({ has: page.getByRole('heading', { name: labels.orderDetailsHeading }) });
    const row = (label: string) => details.locator('.cart-row').filter({ has: page.getByText(label, { exact: true }) });
    await expect(row(labels.orderDetailsProductsRow)).toContainText(data.productsCount);
    await expect(row(labels.orderDetailsSubtotalRow)).toContainText(data.subtotal);
    await expect(row(labels.orderDetailsShippingRow)).toContainText(data.shippingCharges);
    await expect(row(labels.orderDetailsTotalRow)).toContainText(data.total);
  });
});
