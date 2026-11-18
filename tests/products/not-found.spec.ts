import { test, expect } from '@playwright/test';
import { testData } from '../helpers/data';

const data = testData.suites.products.notFound;

test.describe('Routing', () => {
  test('PRD-09 unknown route renders without crashing (no 404 UI)', async ({ page }) => {
    test.info().annotations.push({ type: 'note', description: 'Observed: blank page, no 404 UI.' });
    const errors: Error[] = [];
    page.on('pageerror', (e) => errors.push(e));

    const response = await page.goto(data.unknownRoute);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('#root')).toBeAttached();
    expect(errors).toEqual([]);
  });
});
