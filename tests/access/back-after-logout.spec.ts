import { test, expect } from '@playwright/test';
import { newLoggedInUser, getStorage, expectToastDuring } from '../helpers/shop';
import { testData, text, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Access control', () => {
  test('ACL-06 browser back to /checkout after logout is blocked', async ({ page }) => {
    await newLoggedInUser(page);
    await page.goto(routes.checkout);
    await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();

    await page.getByRole('button', { name: text(labels.logoutButton) }).click();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();
    expect((await getStorage(page)).token).toBeNull();

    await expectToastDuring(page, text(messages.mustBeLoggedInForCheckout), () => page.goBack());

    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.getByRole('button', { name: text(labels.placeOrder) })).toHaveCount(0);
  });
});
