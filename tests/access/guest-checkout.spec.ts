import { test, expect } from '@playwright/test';
import { expectToastDuring } from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;

test.describe('Access control', () => {
  test('ACL-01 guest visiting /checkout is redirected with a toast', async ({ page }) => {
    await expectToastDuring(page, text(messages.mustBeLoggedInForCheckout), () => page.goto(routes.checkout));

    await expect(page).toHaveURL(urlEndsWith(routes.home));
    await expect(page.locator('.card').first()).toBeVisible();
  });
});
