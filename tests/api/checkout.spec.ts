import { test, expect, ApiUser } from './fixtures';
import {
  Address, apiAddAddress, apiAddToCart, apiGetAddresses, apiCheckout, apiGetCart, apiLogin, bearer, CartItem, LoginResponse,
  apiGetProducts, Product,
} from '../helpers/api';
import { testData } from '../helpers/data';

const { messages, checkout } = testData.api;
const VALID = testData.addresses.valid;
const START_BALANCE = testData.users.validUser.initialBalance;

type Req = Parameters<typeof apiGetCart>[0];
type Line = { product: string; qty: number };
type ProductKey = keyof typeof checkout.products;

const toCartItem = (l: Line): CartItem => ({ productId: checkout.products[l.product as ProductKey].productId, qty: l.qty });

/** Saves a valid address for the user behind `req` and returns its id. */
async function addAddress(req: Req): Promise<string> {
  const res = await apiAddAddress(req, { address: VALID });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as Address[])[0]._id;
}

/** Puts the given lines in the cart (POST cart sets qty, it does not validate it) and returns the expected cart. */
async function fillCart(req: Req, lines: Line[]): Promise<CartItem[]> {
  for (const l of lines) {
    const res = await apiAddToCart(req, toCartItem(l));
    expect(res.status(), await res.text()).toBe(200);
  }
  return lines.map(toCartItem);
}

/** Current wallet balance. There is no balance endpoint; POST auth/login returns it. */
async function balanceOf(req: Req, user: ApiUser): Promise<number> {
  const res = await apiLogin(req, { username: user.username, password: user.password });
  expect(res.status()).toBe(201);
  return ((await res.json()) as LoginResponse).balance;
}

const cartOf = async (req: Req) => (await (await apiGetCart(req)).json()) as CartItem[];

/** Current `stock` of a product, read from GET products. */
async function stockOf(req: Req, productId: string): Promise<number> {
  const res = await apiGetProducts(req);
  expect(res.status()).toBe(200);
  const product = ((await res.json()) as Product[]).find((p) => p._id === productId);
  expect(product, `product ${productId} in catalogue`).toBeDefined();
  return product!.stock;
}

test.describe('API: checkout', () => {
  test.describe('success', () => {
    for (const order of checkout.orders) {
      test(`checks out ${order.label}: 200, cart emptied, balance reduced by ${order.total}`, async ({ request, apiUser, authed }) => {
        expect(apiUser.balance).toBe(START_BALANCE);
        const addressId = await addAddress(authed);
        await fillCart(authed, order.items);

        await test.step('checkout', async () => {
          const res = await apiCheckout(authed, { addressId });
          expect(res.status()).toBe(200);
          expect(await res.json()).toEqual({ success: true });
        });

        await test.step('cart is empty', async () => {
          expect(await cartOf(authed)).toEqual([]);
        });

        await test.step('balance = start - total', async () => {
          expect(await balanceOf(request, apiUser)).toBe(START_BALANCE - order.total);
        });
      });
    }

    test('keeps the address after checkout', async ({ authed }) => {
      const addressId = await addAddress(authed);
      await fillCart(authed, checkout.orders[0].items);

      expect((await apiCheckout(authed, { addressId })).status()).toBe(200);

      const res = await apiGetAddresses(authed);
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([{ _id: addressId, address: VALID }]);
    });

    test('a second order after re-filling the cart charges only its own total', async ({ request, apiUser, authed }) => {
      const addressId = await addAddress(authed);
      let expectedBalance = START_BALANCE;

      for (const [i, order] of checkout.sequentialOrders.entries()) {
        await test.step(`order ${i + 1}: fill cart and check out ($${order.total})`, async () => {
          await fillCart(authed, order.items);
          const res = await apiCheckout(authed, { addressId });
          expect(res.status()).toBe(200);
          expect(await res.json()).toEqual({ success: true });
          expectedBalance -= order.total;
        });

        await test.step(`order ${i + 1}: cart empty, balance = ${expectedBalance}`, async () => {
          expect(await cartOf(authed)).toEqual([]);
          expect(await balanceOf(request, apiUser)).toBe(expectedBalance);
        });
      }
    });

    test('checkout reduces the stock of the ordered product by the ordered qty', async ({ request, authed }) => {
      // KNOWN APPLICATION DEFECT (requirement to confirm with the product owner): checkout never decrements `stock`.
      // Reproduce (curl, 2026-11-19), fresh user with one address:
      //   GET products -> "Roadster Mens Running Shoes" (_id 3W0jAAeDJmlZCF8) "stock":10
      //   POST cart {"productId":"3W0jAAeDJmlZCF8","qty":1}; POST cart/checkout {addressId} -> 200 {"success":true}
      //   GET products -> same product still "stock":10 (book stays 10 after a qty-2 order too; every product shows 10
      //   despite many prior orders). Combined with POST cart ignoring stock (cart.spec.ts), stock is never enforced.
      // Expected: stock after <= stock before - qty.
      // Robustness: other parallel tests/users can only lower stock further, so the assertion is "dropped by at least
      // qty" around our own checkout rather than an exact value; no serial mode needed. qty is 1 to avoid draining shared stock.
      test.fixme(true, 'App defect: checkout does not decrement product stock');
      test.info().annotations.push({ type: 'defect', description: 'Product stock unchanged after checkout.' });

      const { product, qty } = checkout.stockCheck;
      const { productId } = checkout.products[product as ProductKey];
      const addressId = await addAddress(authed);

      const before = await test.step('stock before', () => stockOf(request, productId));
      expect(before, 'need stock > qty so the order is legitimate').toBeGreaterThan(qty);

      await fillCart(authed, [{ product, qty }]);
      expect((await apiCheckout(authed, { addressId })).status()).toBe(200);

      const after = await test.step('stock after', () => stockOf(request, productId));
      expect(after).toBeLessThanOrEqual(before - qty);
    });
  });

  test.describe('rejections (nothing charged, cart kept)', () => {
    test('an empty cart -> 400 "Cart is empty"', async ({ request, apiUser, authed }) => {
      const addressId = await addAddress(authed);

      const res = await apiCheckout(authed, { addressId });

      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ success: false, message: messages.cartIsEmpty });
      expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
    });

    for (const c of checkout.badAddressIds) {
      test(`${c.label} -> ${c.status}`, async ({ request, apiUser, authed }) => {
        await addAddress(authed);
        const cart = await fillCart(authed, checkout.orders[0].items);

        const res = await apiCheckout(authed, c.addressId ? { addressId: c.addressId } : {});

        expect(res.status()).toBe(c.status);
        expect(await res.json()).toEqual({ success: false, message: messages[c.message as keyof typeof messages] });
        expect(await cartOf(authed)).toEqual(cart);
        expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
      });
    }

    test('a cart total above the balance -> 400 insufficient balance', async ({ request, apiUser, authed }) => {
      const addressId = await addAddress(authed);
      const cart = await fillCart(authed, checkout.insufficient.items);
      expect(checkout.insufficient.total).toBeGreaterThan(apiUser.balance);

      const res = await apiCheckout(authed, { addressId });

      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ success: false, message: messages.insufficientBalance });
      expect(await cartOf(authed)).toEqual(cart);
      expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
    });

    test("user B cannot check out to user A's address (404, B not charged)", async ({ request, authed, otherUser, otherAuthed }) => {
      const addressOfA = await addAddress(authed);
      const cartOfB = await fillCart(otherAuthed, checkout.orders[0].items);

      const res = await apiCheckout(otherAuthed, { addressId: addressOfA });

      expect(res.status()).toBe(404);
      expect(await res.json()).toEqual({ success: false, message: messages.badAddress });
      expect(await cartOf(otherAuthed)).toEqual(cartOfB);
      expect(await balanceOf(request, otherUser)).toBe(START_BALANCE);
    });

    for (const c of checkout.negativeQty) {
      test(`a cart with ${c.label} is rejected and the balance is not changed`, async ({ request, apiUser, authed }) => {
        // KNOWN APPLICATION DEFECT: POST cart accepts negative qty (see cart.spec.ts) and checkout charges
        // sum(cost * qty) without validating it, so a negative line credits the wallet. Reproduce (curl, 2026-11-19), fresh users:
        //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":-10}; POST cart/checkout {addressId} -> 200 {"success":true}; login balance 5150
        //   POST cart roadster qty 1 ($30) + book qty -1 ($15); POST cart/checkout              -> 200; login balance 4985 (charged $15)
        // Expected: 400 {success:false, message}; balance stays 5000. This lets any user mint wallet money.
        test.fixme(true, `App defect: checkout accepts negative cart qty and pays out (balance ${START_BALANCE} -> ${c.observedBalance})`);
        test.info().annotations.push({ type: 'defect', description: 'Checkout does not validate qty; negative lines credit the wallet.' });

        const addressId = await addAddress(authed);
        await fillCart(authed, c.items);

        const res = await apiCheckout(authed, { addressId });

        expect(res.status()).toBe(400);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
        expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
      });
    }
  });

  test.describe('concurrency', () => {
    test('two concurrent checkouts of one cart succeed once and charge once', async ({ request, apiUser, authed }) => {
      const addressId = await addAddress(authed);
      await fillCart(authed, checkout.doubleSubmit.items);

      // Same race as the UI double-click defect (tests/order/double-submit.spec.ts). Exactly 2 parallel requests.
      const results = await Promise.all([apiCheckout(authed, { addressId }), apiCheckout(authed, { addressId })]);
      const statuses = results.map((r) => r.status()).sort();

      await test.step('exactly one succeeds, the other sees an empty cart', async () => {
        expect(statuses).toEqual([200, 400]);
        const failed = results.find((r) => r.status() === 400)!;
        expect(await failed.json()).toEqual({ success: false, message: messages.cartIsEmpty });
      });

      await test.step('charged once', async () => {
        expect(await cartOf(authed)).toEqual([]);
        expect(await balanceOf(request, apiUser)).toBe(START_BALANCE - checkout.doubleSubmit.total);
      });
    });
  });

  test.describe('auth', () => {
    const missingTokenCases = [
      { label: 'no Authorization header', headers: (_token: string) => ({}) },
      { label: 'a token without the Bearer prefix', headers: (token: string) => ({ Authorization: token }) },
    ];
    const badToken = testData.api.cart.malformedTokens[0];

    for (const c of missingTokenCases) {
      test(`POST cart/checkout with ${c.label} -> 401, nothing charged`, async ({ request, apiUser, authed }) => {
        const addressId = await addAddress(authed);
        const cart = await fillCart(authed, checkout.orders[0].items);

        const res = await apiCheckout(request, { addressId }, c.headers(apiUser.token));

        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ success: false, message: messages.bearerTokenNotFound });
        expect(await cartOf(authed)).toEqual(cart);
        expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
      });
    }

    test(`POST cart/checkout with ${badToken.label} is rejected, nothing charged`, async ({ request, apiUser, authed }) => {
      const addressId = await addAddress(authed);
      const cart = await fillCart(authed, checkout.orders[0].items);

      const res = await apiCheckout(request, { addressId }, bearer(badToken.token!));

      expect(res.ok()).toBe(false);
      expect(await res.json()).toEqual({ success: false, message: messages.badOrExpiredToken });
      expect(await cartOf(authed)).toEqual(cart);
      expect(await balanceOf(request, apiUser)).toBe(START_BALANCE);
    });

    test(`POST cart/checkout with ${badToken.label} -> 401`, async ({ request }) => {
      // KNOWN APPLICATION DEFECT (same as cart): invalid Bearer token -> 400, missing token -> 401. Reproduce (curl, 2026-11-19):
      //   POST cart/checkout -H "Authorization: Bearer garbage" {"addressId":"<id>"} -> 400 {"success":false,"message":"Bad or expired token"}
      // Expected: 401 (RFC 6750 §3.1, invalid_token).
      test.fixme(true, 'App defect: invalid Bearer token returns 400 instead of 401');
      test.info().annotations.push({ type: 'defect', description: 'Bad token -> 400, should be 401.' });

      const res = await apiCheckout(request, { addressId: testData.api.addresses.unknownId }, bearer(badToken.token!));

      expect(res.status()).toBe(401);
    });
  });
});
