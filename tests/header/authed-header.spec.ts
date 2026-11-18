import { test, expect, Page } from '@playwright/test';
import {
  newLoggedInUser, addToCart, PRODUCTS, checkoutWithNewAddress, searchBox,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { routes, labels } = testData;

async function expectAuthedHeader(page: Page, username: string) {
  await expect(page.getByRole('img', { name: username })).toBeVisible();
  await expect(page.locator('.username-text')).toHaveText(username);
  await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
  await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toHaveCount(0);
  await expect(page.getByRole('button', { name: exactText(labels.headerRegisterButton) })).toHaveCount(0);
}

test.describe('Header', () => {
  test('HDR-05 logged-in header shows username and avatar on /, /checkout and /thanks', async ({ page }) => {
    const username = await newLoggedInUser(page);
    await expectAuthedHeader(page, username);
    await expect(searchBox(page)).toBeVisible();

    await addToCart(page, PRODUCTS.book);
    await checkoutWithNewAddress(page);
    // checkoutWithNewAddress passed through /checkout; we are now on /thanks.
    await expectAuthedHeader(page, username);
    await expect(searchBox(page)).toHaveCount(0);

    await page.goto(routes.checkout);
    await expectAuthedHeader(page, username);
    await expect(searchBox(page)).toHaveCount(0);
  });
});
