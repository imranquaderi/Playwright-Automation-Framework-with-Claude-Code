import { test, expect } from '@playwright/test';
import { newLoggedInUser, getStorage } from '../helpers/shop';
import { testData, text } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Login', () => {
  test('LOGIN-10 session persists across reload and new tab', async ({ page, context }) => {
    const username = await newLoggedInUser(page);
    const before = await getStorage(page);

    await page.reload();
    await expect(page.locator('.username-text')).toHaveText(username);
    await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
    expect(await getStorage(page)).toEqual(before);

    const second = await context.newPage();
    await second.goto(routes.home);
    await expect(second.locator('.username-text')).toHaveText(username);
    await expect(second.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
    expect(await getStorage(second)).toEqual(before);
  });
});
