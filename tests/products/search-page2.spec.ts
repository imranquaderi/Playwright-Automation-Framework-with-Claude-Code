import { test, expect } from '@playwright/test';
import { productCards, search, PRODUCTS } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.products.searchPage2;

test.describe('Product search', () => {
  test('PRD-08 search finds a product that lives on page 2', async ({ page }) => {
    await page.goto(routes.home);
    await search(page, data.term);

    await expect(productCards(page)).toHaveCount(data.expectedCount);
    await expect(productCards(page).filter({ hasText: PRODUCTS.wallet })).toBeVisible();
  });

  for (const term of data.specialCharacterTerms) {
    test(`PRD-08 special characters "${term}" yield no results without crashing`, async ({ page }) => {
      const errors: Error[] = [];
      page.on('pageerror', (e) => errors.push(e));
      await page.goto(routes.home);
      await search(page, term);

      await expect(page.getByText(text(messages.noProductsFound))).toBeVisible();
      await expect(productCards(page)).toHaveCount(0);
      await expect(page.locator('.header')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
