import { test, expect } from '@playwright/test';
import { productCards, search } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, labels, messages } = testData;
const data = testData.suites.products.searchNone;

test.describe('Product search', () => {
  test('PRD-05 search with no results', async ({ page }) => {
    await page.goto(routes.home);
    await search(page, data.term);

    await expect(page.getByText(text(messages.noProductsFound))).toBeVisible();
    await expect(productCards(page)).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: text(labels.pagination) })).toHaveCount(0);
  });
});
