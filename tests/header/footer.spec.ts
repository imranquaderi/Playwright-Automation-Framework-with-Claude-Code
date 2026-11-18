import { test, expect } from '@playwright/test';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;
const { links } = testData.suites.header.footer;

test.describe('Footer', () => {
  for (const link of links) {
    test(`HDR-08 footer link ${link.name} opens a page with content`, async ({ page, context }) => {
      await page.goto(routes.home);
      // Footer links open in a new tab (target=_blank).
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('.footer').getByRole('link', { name: text(link.name) }).click(),
      ]);
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(urlEndsWith(link.path));
      await expect
        .poll(async () => (await popup.locator('body').innerText()).length)
        .toBeGreaterThan(link.minChars);
    });
  }

  test('HDR-08 "Contact us" is plain text, not a link', async ({ page }) => {
    await page.goto(routes.home);
    const footer = page.locator('.footer');
    await expect(footer.getByText(labels.contactUs)).toBeVisible();
    await expect(footer.getByRole('link', { name: text(labels.contactUs) })).toHaveCount(0);
  });
});
