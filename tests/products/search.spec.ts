import { test, expect } from '@playwright/test';
import { productCards, search, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const { routes } = testData;
const data = testData.suites.products.search;

test.describe('Product search', () => {
  test('PRD-03 search by product name', async ({ page }) => {
    await page.goto(routes.home);
    await search(page, data.term);

    // Search is debounced (~1s); web-first assertions wait for it.
    const cards = productCards(page);
    await expect(cards).toHaveCount(data.expectedCount);
    await expect(cards.filter({ hasText: PRODUCTS.roadster })).toBeVisible();
    await expect(cards.filter({ hasText: PRODUCTS.nike })).toBeVisible();
  });
});
