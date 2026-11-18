import { test, expect } from '@playwright/test';
import { productCard, PRODUCTS, cartRows, cartTotal } from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Cart', () => {
  test('CART-01 guest cannot add to cart', async ({ page }) => {
    await page.goto(routes.home);
    await productCard(page, PRODUCTS.sofa).getByRole('button', { name: text(labels.addToCart) }).click();

    await expect(page.getByText(text(messages.loginToAddToCart))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(cartRows(page)).toHaveCount(0);
    await expect(cartTotal(page)).toHaveCount(0);
  });
});
