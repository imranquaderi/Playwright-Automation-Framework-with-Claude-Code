import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, cartRows, cartRow, cartTotal, PRODUCTS, productCard } from '../helpers/shop';
import { testData, text, fill } from '../helpers/data';

const { labels } = testData;
const data = testData.suites.cart.page2;

test.describe('Cart', () => {
  test('CART-10 add products from page 2', async ({ page }) => {
    test.fail(true, 'Defect: page-2 products render in the cart without name/price and the total becomes "$NaN" (persists after reload).');
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.book);

    await page.getByRole('button', { name: fill(labels.goToPage, { page: data.pageNumber }) }).click();
    await expect(productCard(page, PRODUCTS.penDrive)).toBeVisible();
    await productCard(page, PRODUCTS.penDrive).getByRole('button', { name: text(labels.addToCart) }).click();

    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(cartTotal(page)).toHaveText(data.expectedTotal, { timeout: 5_000 }); // book + pen drive
    await expect(cartRow(page, PRODUCTS.penDrive)).toContainText(data.penDrivePrice);
  });
});
