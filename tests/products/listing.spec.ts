import { test, expect } from '@playwright/test';
import { productCards, productCard, PRODUCTS, PAGE_1_COUNT } from '../helpers/shop';
import { testData, text, fill } from '../helpers/data';

const { routes, labels, products } = testData;
const data = testData.suites.products.listing;

test.describe('Product listing', () => {
  test('PRD-01 landing page lists products with price and rating', async ({ page }) => {
    await page.goto(routes.home);

    await expect(page.locator('.hero-heading')).toContainText(text(data.heroHeadingLine1));
    await expect(page.locator('.hero-heading')).toContainText(text(data.heroHeadingLine2));

    const cards = productCards(page);
    await expect(cards).toHaveCount(PAGE_1_COUNT);

    for (const card of await cards.all()) {
      await expect(card.locator('img').first()).toBeVisible();
      await expect(card.locator('p').first()).not.toBeEmpty();
      await expect(card.getByText(new RegExp(data.pricePattern))).toBeVisible();
      await expect(card.getByRole('img', { name: text(labels.ratingStars) })).toBeVisible();
      await expect(card.getByRole('button', { name: text(labels.addToCart) })).toBeVisible();
    }

    await expect(
      productCard(page, PRODUCTS.sofa).getByText(fill(labels.priceFormat, { amount: products.sofa.price })),
    ).toBeVisible();
    await expect(
      productCard(page, PRODUCTS.book).getByText(fill(labels.priceFormat, { amount: products.book.price })),
    ).toBeVisible();

    for (const shoe of [PRODUCTS.roadster, PRODUCTS.nike]) {
      const card = productCard(page, shoe);
      await expect(card.getByRole('button', { name: text(labels.sizeChart) })).toBeVisible();
      const size = card.getByRole('combobox');
      await expect(size).toHaveValue(data.defaultShoeSize);
      await expect(size.locator('option')).toHaveText(data.shoeSizes);
    }
  });
});
