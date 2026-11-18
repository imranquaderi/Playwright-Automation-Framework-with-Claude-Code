import { test, expect } from '@playwright/test';
import { productCards, productCard, search, PAGE_1_COUNT, PAGE_2_PRODUCTS, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, labels, messages } = testData;
const { searchTerm, expectedSearchResultCount } = testData.suites.access.guestBrowse;

test.describe('Access control', () => {
  test('ACL-03 guest can browse and search but not add to cart', async ({ page }) => {
    await page.goto(routes.home);
    await expect(productCards(page)).toHaveCount(PAGE_1_COUNT);

    await page.getByRole('button', { name: labels.goToPage2 }).click();
    await expect(productCards(page)).toHaveCount(PAGE_2_PRODUCTS.length);

    await search(page, searchTerm);
    await expect(productCards(page)).toHaveCount(expectedSearchResultCount);

    // Roadster rather than Nike: Nike's add-to-cart button is a no-op (see CART-09).
    await productCard(page, PRODUCTS.roadster).getByRole('button', { name: text(labels.addToCart) }).click();
    await expect(page.getByText(text(messages.loginToAddToCart))).toBeVisible();
  });
});
