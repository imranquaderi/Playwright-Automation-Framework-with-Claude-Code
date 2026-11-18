import { test, expect } from '@playwright/test';
import { productCards, search, PAGE_1_COUNT } from '../helpers/shop';
import { testData } from '../helpers/data';

const { routes } = testData;
const data = testData.suites.products.searchClear;

test.describe('Product search', () => {
  test('PRD-06 clearing search restores the page-1 products', async ({ page }) => {
    await page.goto(routes.home);
    await expect(productCards(page)).toHaveCount(PAGE_1_COUNT);
    const page1Names = await productCards(page).evaluateAll((cards) =>
      cards.map((c) => c.querySelector('p')?.textContent?.trim() ?? ''),
    );

    await search(page, data.term);
    await expect(productCards(page)).toHaveCount(data.expectedCount);

    await search(page, data.clearedTerm);
    for (const name of page1Names) {
      await expect(productCards(page).filter({ hasText: name }).first()).toBeVisible();
    }
  });

  test('PRD-06 after clearing search the list is paginated to 12 again', async ({ page }) => {
    test.fail(true, 'Defect: after clearing the search box all 21 products render on one page instead of 12.');

    await page.goto(routes.home);
    await search(page, data.term);
    await expect(productCards(page)).toHaveCount(data.expectedCount);

    await search(page, data.clearedTerm);
    await expect(productCards(page)).not.toHaveCount(data.expectedCount);
    await expect(productCards(page)).toHaveCount(PAGE_1_COUNT, { timeout: 5_000 });
  });
});
