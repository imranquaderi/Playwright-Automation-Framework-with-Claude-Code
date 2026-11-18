import { test, expect } from '@playwright/test';
import {
  newLoggedInUser, goToCheckout, addToCart, setQty, paymentText, getStorage, cartTotal, PRODUCTS,
} from '../helpers/shop';
import { testData, fill } from '../helpers/data';

const { routes } = testData;
const data = testData.suites.checkout.wallet;

type ProductKey = keyof typeof PRODUCTS;

test.describe('Checkout', () => {
  test('CHK-10 wallet payment text matches order total and balance', async ({ page }) => {
    await newLoggedInUser(page);
    const balance = Number((await getStorage(page)).balance);
    expect(balance).toBe(testData.users.validUser.initialBalance);

    const scenarios: Array<{ add?: string; qty?: [string, number]; total: number }> = data.scenarios.map((s) => ({
      add: s.add ? PRODUCTS[s.add as ProductKey] : undefined,
      qty: s.qtyProduct && s.qty !== undefined ? [PRODUCTS[s.qtyProduct as ProductKey], s.qty] : undefined,
      total: s.total,
    }));

    for (const s of scenarios) {
      await page.goto(routes.home);
      if (s.add) await addToCart(page, s.add);
      if (s.qty) await setQty(page, ...s.qty);
      await expect(cartTotal(page)).toHaveText(fill(data.cartTotalTemplate, { total: s.total }));

      await goToCheckout(page);
      await expect(paymentText(page, s.total, balance)).toBeVisible();
      await expect(cartTotal(page)).toHaveText(fill(data.cartTotalTemplate, { total: s.total }));
    }
  });
});
