import { test, expect } from '@playwright/test';
import { searchBox } from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Header', () => {
  test('HDR-02 guest header on landing page', async ({ page }) => {
    await page.goto(routes.home);

    await expect(page.locator('.header-title a')).toHaveAttribute('href', routes.home);
    await expect(page.getByRole('img', { name: labels.logoAlt }).first()).toBeVisible();
    await expect(searchBox(page)).toBeVisible();
    await expect(searchBox(page)).toHaveAttribute('placeholder', labels.searchPlaceholder);
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();
    await expect(page.getByRole('button', { name: exactText(labels.headerRegisterButton) })).toBeVisible();
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toHaveCount(0);
    await expect(page.locator('.username-text')).toHaveCount(0);
  });
});
