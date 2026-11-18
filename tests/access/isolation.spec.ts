import { test, expect } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from '../helpers/auth';
import {
  newLoggedInUser, openCheckout, addStandardCart, goToCheckout, addAddress, addressItems, cartRows, cartPanel, getStorage,
  EMPTY_CART, NO_ADDRESSES, VALID_ADDRESS,
} from '../helpers/shop';
import { testData, text, exactText } from '../helpers/data';

const { labels } = testData;
const { initialBalance } = testData.users.validUser;

test.describe('Access control', () => {
  test('ACL-05 a second user sees none of the first user\'s data', async ({ page }) => {
    await newLoggedInUser(page);
    await addStandardCart(page);
    await goToCheckout(page);
    await addAddress(page, VALID_ADDRESS);
    await page.getByRole('button', { name: text(labels.logoutButton) }).click();
    await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();

    const userB = uniqueUsername();
    await registerUser(page, userB, PASSWORD);
    await login(page, userB, PASSWORD);
    await expect(page.locator('.username-text')).toHaveText(userB);

    await expect(cartPanel(page)).toContainText(EMPTY_CART);
    await expect(cartRows(page)).toHaveCount(0);
    expect((await getStorage(page)).balance).toBe(String(initialBalance));

    await openCheckout(page);
    await expect(page.getByText(NO_ADDRESSES)).toBeVisible();
    await expect(addressItems(page)).toHaveCount(0);
  });
});
