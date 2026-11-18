import { test, expect } from '@playwright/test';
import { newLoggedInUser } from '../helpers/shop';
import { testData, text, urlEndsWith } from '../helpers/data';

const { routes, labels } = testData;

test.describe('Login', () => {
  test('LOGIN-11 /login and /register still render forms while logged in (current behaviour)', async ({ page }) => {
    test.info().annotations.push({
      type: 'note',
      description: 'No redirect to / for authenticated users. Flag if product expects a redirect.',
    });
    await newLoggedInUser(page);

    await page.goto(routes.login);
    await expect(page).toHaveURL(urlEndsWith(routes.login));
    await expect(page.getByRole('button', { name: text(labels.loginButton) })).toBeVisible();

    await page.goto(routes.register);
    await expect(page).toHaveURL(urlEndsWith(routes.register));
    await expect(page.getByRole('button', { name: text(labels.registerButton) })).toBeVisible();
  });
});
