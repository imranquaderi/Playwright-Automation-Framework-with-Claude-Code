import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { PASSWORD } from '../helpers/auth';
import { testData, text, fill } from '../helpers/data';

const { routes, labels } = testData;
const data = testData.suites.registration.registerMisc;

test.describe('Registration', () => {
  test('REG-10 password fields are masked', async ({ page }) => {
    await page.goto(routes.register);
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('type', 'password');
  });

  test('REG-10 username with whitespace and symbols is handled gracefully (exploratory)', async ({ page }) => {
    const username = fill(data.usernameTemplate, { suffix: randomUUID().slice(0, 8) });
    await page.goto(routes.register);
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);
    await page.getByRole('button', { name: text(labels.registerButton) }).click();

    // Either success or rejection is acceptable; we require a handled response (toast) and no blank screen.
    const toast = page.locator('#notistack-snackbar').first();
    await expect(toast).toBeVisible();
    test.info().annotations.push({
      type: 'observed',
      description: `toast="${await toast.innerText()}" url=${page.url()}`,
    });
    await expect(page.getByRole('heading', { name: new RegExp(data.headingPattern, 'i') })).toBeVisible();
  });
});
