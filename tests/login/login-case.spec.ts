import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import { testData, text, escapeRegex, urlEndsWith } from '../helpers/data';

const { routes, messages } = testData;
const data = testData.suites.login.loginCase;

test.describe('Login', () => {
  test('LOGIN-09 upper-cased username is rejected', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);

    await login(page, username.toUpperCase(), PASSWORD);

    await expect(page.getByText(text(messages.usernameDoesNotExist))).toBeVisible();
    await expect(page).toHaveURL(urlEndsWith(routes.login));
  });

  test('LOGIN-09 username with trailing space is handled consistently (exploratory)', async ({ page }) => {
    const username = uniqueUsername();
    await registerUser(page, username, PASSWORD);

    await login(page, `${username}${data.trailingWhitespace}`, PASSWORD);

    // Either trimmed (success) or rejected - both acceptable, but it must be one of the two.
    const outcome = page.getByText(
      new RegExp([messages.loggedInSuccessfully, messages.usernameDoesNotExist].map(escapeRegex).join('|'), 'i'),
    );
    await expect(outcome).toBeVisible();
    test.info().annotations.push({ type: 'observed', description: `toast="${await outcome.innerText()}"` });
  });
});
