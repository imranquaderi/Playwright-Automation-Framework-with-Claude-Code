import { test, expect } from '@playwright/test';
import { PASSWORD, login } from '../helpers/auth';
import {
  newLoggedInUser, addToCart, setQty, cartRows, cartRow, cartTotal, itemQty, PRODUCTS,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { routes, labels } = testData;
const data = testData.suites.cart.persist;

test.describe('Cart', () => {
  test('CART-08 cart persists across reload and logout/login', async ({ page }) => {
    const username = await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.sofa);
    await addToCart(page, PRODUCTS.book);
    await setQty(page, PRODUCTS.book, data.bookQty);
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);

    await page.reload();
    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(itemQty(page, PRODUCTS.book)).toHaveText(String(data.bookQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);

    await page.getByRole('button', { name: text(labels.logoutButton) }).click();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();
    await expect(cartRows(page)).toHaveCount(0); // guest sees no cart
    await expect(cartTotal(page)).toHaveCount(0);

    await page.goto(routes.login);
    await login(page, username, PASSWORD);
    await expect(cartRow(page, PRODUCTS.sofa)).toBeVisible();
    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(itemQty(page, PRODUCTS.book)).toHaveText(String(data.bookQty));
    await expect(cartTotal(page)).toHaveText(data.expectedTotal);
  });
});
