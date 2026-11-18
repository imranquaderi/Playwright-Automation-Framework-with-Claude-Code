import { test, expect } from '@playwright/test';
import { productCards, PAGE_1_COUNT, PAGE_2_PRODUCTS, PRODUCTS } from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

const pagination = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: text(labels.paginationNav) });

test.describe('Product listing - pagination', () => {
  test('PRD-02 page 1 shows 12 products with Previous disabled', async ({ page }) => {
    await page.goto(routes.home);
    await expect(productCards(page)).toHaveCount(PAGE_1_COUNT);
    await expect(page.getByRole('button', { name: labels.currentPage1 })).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('button', { name: labels.goToPreviousPage })).toBeDisabled();
  });

  for (const control of [labels.goToPage2, labels.goToNextPage]) {
    test(`PRD-02 "${control}" shows the 9 page-2 products without changing the URL`, async ({ page }) => {
      await page.goto(routes.home);
      await page.getByRole('button', { name: control }).click();

      const cards = productCards(page);
      await expect(cards).toHaveCount(PAGE_2_PRODUCTS.length);
      for (const name of PAGE_2_PRODUCTS) {
        await expect(cards.filter({ hasText: name }).first()).toBeVisible();
      }
      await expect(page).toHaveURL(urlEndsWith(routes.home));
    });
  }

  test('PRD-02 user can navigate back from page 2 to page 1', async ({ page }) => {
    test.fail(true, 'Defect: the pagination control disappears on page 2, so there is no way back to page 1.');

    await page.goto(routes.home);
    await page.getByRole('button', { name: labels.goToPage2 }).click();
    await expect(productCards(page)).toHaveCount(PAGE_2_PRODUCTS.length);

    await expect(pagination(page)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: labels.goToPreviousPage }).click({ timeout: 5_000 });
    await expect(productCards(page)).toHaveCount(PAGE_1_COUNT);
    await expect(productCards(page).filter({ hasText: PRODUCTS.sofa })).toBeVisible();
  });
});
