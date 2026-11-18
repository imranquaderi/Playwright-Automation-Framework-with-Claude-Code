import { test, expect } from '@playwright/test';
import { productCards, search, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const { routes } = testData;
const data = testData.suites.products.searchCase;

test.describe('Product search', () => {
  for (const term of data.terms) {
    test(`PRD-04 search is case-insensitive: "${term}"`, async ({ page }) => {
      await page.goto(routes.home);
      await search(page, term);

      const cards = productCards(page);
      await expect(cards).toHaveCount(data.expectedCount);
      await expect(cards.filter({ hasText: PRODUCTS.roadster })).toBeVisible();
      await expect(cards.filter({ hasText: PRODUCTS.nike })).toBeVisible();
    });
  }
});
