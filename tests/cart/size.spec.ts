import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, productCard, cartRow, cartRows, cartTotal, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { labels } = testData;
const data = testData.suites.cart.size;

test.describe('Cart - sized products', () => {
  test('CART-09 product with a selected size is added at its price', async ({ page }) => {
    test.info().annotations.push({ type: 'gap', description: 'Cart does not display the selected shoe size.' });
    await newLoggedInUser(page);

    const size = productCard(page, PRODUCTS.roadster).getByRole('combobox');
    await size.selectOption(data.shoeSize);
    await expect(size).toHaveValue(data.shoeSize);
    await addToCart(page, PRODUCTS.roadster);

    await expect(cartRow(page, PRODUCTS.roadster)).toContainText(data.roadsterPrice);
    await expect(cartRow(page, PRODUCTS.roadster)).not.toContainText(text(data.sizeText));
    await expect(cartTotal(page)).toHaveText(data.roadsterTotal);
  });

  test('CART-09 a second shoe product is added as a distinct line', async ({ page }) => {
    test.fail(true, 'Defect: "Add to cart" on Nike Mens Running Shoes is a silent no-op (no cart line, no toast).');
    await newLoggedInUser(page);
    await addToCart(page, PRODUCTS.roadster);

    await productCard(page, PRODUCTS.nike).getByRole('button', { name: text(labels.addToCart) }).click();

    await expect(cartRow(page, PRODUCTS.nike)).toBeVisible({ timeout: 5_000 });
    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(cartTotal(page)).toHaveText(data.twoShoesTotal);
  });
});
