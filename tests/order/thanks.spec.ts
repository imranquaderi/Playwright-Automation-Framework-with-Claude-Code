import { test, expect } from '@playwright/test';
import { newLoggedInUser, addStandardCart, checkoutWithNewAddress } from '../helpers/shop';
import { testData, text, fill } from '../helpers/data';

const { labels, messages } = testData;
const data = testData.suites.order.thanks;

test.describe('Order placement', () => {
  test('ORD-02 thanks page content', async ({ page }) => {
    const username = await newLoggedInUser(page);
    await addStandardCart(page);
    await checkoutWithNewAddress(page);

    await expect(page.getByText(new RegExp(messages.orderedHeadingPattern, 'i'))).toBeVisible();
    await expect(page.getByText(text(messages.invoiceShortly))).toBeVisible();
    await expect(page.getByText(text(messages.orderArrival))).toBeVisible();
    await expect(page.getByText(text(labels.walletBalance))).toBeVisible();
    await expect(
      page.getByText(new RegExp(fill(messages.balanceAvailablePattern, { balance: data.balanceAfterOrder }), 'i')),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.continueShopping) })).toBeVisible();
    await expect(page.locator('.username-text')).toHaveText(username);
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
  });
});
