import { test, expect } from '@playwright/test';
import { productCards, search, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.products.searchCategory;

test.describe('Product search', () => {
  test('PRD-07 search by category finds matching products', async ({ page }) => {
    // Plan recorded this as a gap, but live run shows 'Furniture' does return the sofa.
    await page.goto(routes.home);
    await search(page, data.term);

    await expect(productCards(page).filter({ hasText: PRODUCTS.sofa })).toBeVisible();
    await expect(page.getByText(text(messages.noProductsFound))).toHaveCount(0);
  });
});
