import { test, expect } from '@playwright/test';
import { testData, urlEndsWith } from '../helpers/data';

const { routes } = testData;

test.describe('Access control', () => {
  test('ACL-02 guest visiting /thanks is silently redirected to /', async ({ page }) => {
    await page.goto(routes.thanks);

    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.locator('.card').first()).toBeVisible();
    await expect(page.locator('#notistack-snackbar')).toHaveCount(0);
  });
});
