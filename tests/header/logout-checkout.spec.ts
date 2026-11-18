import { test, expect } from '@playwright/test';
import { newLoggedInUser, expectToastDuring } from '../helpers/shop';
import { testData, text, exactText, urlEndsWith } from '../helpers/data';

const { routes, labels, messages } = testData;

test.describe('Header', () => {
  test('HDR-07 logout from checkout then /checkout is blocked', async ({ page }) => {
    await newLoggedInUser(page);
    await page.goto(routes.checkout);
    await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();

    await page.getByRole('button', { name: text(labels.logoutButton) }).click();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();

    await expectToastDuring(page, text(messages.mustBeLoggedInForCheckout), () => page.goto(routes.checkout));
    await expect(page).toHaveURL(urlEndsWith(routes.home));
  });
});
