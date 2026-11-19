import { test, expect } from './fixtures';
import {
  apiAddToCart, apiGetCart, apiLogin, apiPostRawJson, apiRemoveFromCart, apiUpdateCartQty, bearer, CartItemInput, LoginResponse,
} from '../helpers/api';
import { testData } from '../helpers/data';

const { messages, cart, paths } = testData.api;
const { book, roadster } = cart.products;
const PRODUCTS = [
  { label: 'book', ...book },
  { label: 'roadster', ...roadster },
];

/** Replaces a JWT's signature segment, keeping a well-formed header and payload. */
const tamper = (token: string) => `${token.slice(0, token.lastIndexOf('.'))}.${cart.tamperedSignature}`;

test.describe('API: cart', () => {
  test.describe('get', () => {
    test('returns an empty cart for a new user', async ({ authed }) => {
      const res = await apiGetCart(authed);

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    test('the cart persists across a new login (fresh token sees the same lines)', async ({ request, apiUser, authed }) => {
      const items = PRODUCTS.map(({ productId, qty }) => ({ productId, qty }));
      await test.step('add two products with the first token', async () => {
        for (const item of items) expect((await apiAddToCart(authed, item)).status()).toBe(200);
      });

      // JWT iat has 1-second resolution, so a login in the same second returns an identical token; wait just over 1s
      // once (instead of hammering the rate-limited login route) so the second login's token must differ.
      let freshToken = '';
      await test.step('log in again for a fresh token', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1_100));
        const res = await apiLogin(request, { username: apiUser.username, password: apiUser.password });
        expect(res.status()).toBe(201);
        freshToken = ((await res.json()) as LoginResponse).token;
        expect(freshToken).not.toBe(apiUser.token);
      });

      const res = await apiGetCart(request, bearer(freshToken));
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(items.length);
      expect(body).toEqual(expect.arrayContaining(items));
    });
  });

  test.describe('add', () => {
    for (const p of PRODUCTS) {
      test(`adds ${p.label} (qty ${p.qty}) and returns the updated cart`, async ({ authed }) => {
        const item = { productId: p.productId, qty: p.qty };

        await test.step('add', async () => {
          const res = await apiAddToCart(authed, item);
          expect(res.status()).toBe(200);
          const body = await res.json();
          expect(body).toEqual([{ productId: expect.any(String), qty: expect.any(Number) }]);
          expect(body).toEqual([item]);
        });

        await test.step('cart contains the item', async () => {
          const res = await apiGetCart(authed);
          expect(res.status()).toBe(200);
          expect(await res.json()).toEqual([item]);
        });
      });
    }

    test('keeps both lines when two different products are added', async ({ authed }) => {
      for (const p of PRODUCTS) {
        await test.step(`add ${p.label}`, async () => {
          expect((await apiAddToCart(authed, { productId: p.productId, qty: p.qty })).status()).toBe(200);
        });
      }

      const items = await (await apiGetCart(authed)).json();
      expect(items).toHaveLength(PRODUCTS.length);
      expect(items).toEqual(expect.arrayContaining(PRODUCTS.map(({ productId, qty }) => ({ productId, qty }))));
    });

    test('keeps both lines when two different products are added concurrently', async ({ authed }) => {
      // Race check for a lost update on the cart document: exactly 2 parallel requests (shared QA backend).
      // KNOWN APPLICATION DEFECT (intermittent; seen 2026-11-19): two concurrent POST cart requests for different
      // products both return 200, but the stored cart sometimes keeps only one line, e.g.
      //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":1} || POST cart {"productId":"3W0jAAeDJmlZCF8","qty":2}
      //   -> both 200, then GET cart -> [{"productId":"34sLtEcMpzabRyfx","qty":1}]   (expected both lines)
      // Passed 3/3 rounds when first written and 3/3 on re-run, then failed once: a lost update (read-modify-write race).
      // Expected: both lines kept. Remove test.fixme once the backend updates the cart atomically.
      test.fixme(true, 'App defect (intermittent): concurrent POST cart requests can lose an update (only one line kept)');
      const results = await Promise.all(PRODUCTS.map((p) => apiAddToCart(authed, { productId: p.productId, qty: p.qty })));
      for (const res of results) expect(res.status()).toBe(200);

      const items = await (await apiGetCart(authed)).json();
      expect(items).toHaveLength(PRODUCTS.length);
      expect(items).toEqual(expect.arrayContaining(PRODUCTS.map(({ productId, qty }) => ({ productId, qty }))));
    });

    for (const c of cart.invalidProducts) {
      test(`rejects ${c.label} with 404 and leaves the cart unchanged`, async ({ authed }) => {
        const body: CartItemInput = { qty: book.qty };
        if (c.productId) body.productId = c.productId;

        const res = await apiAddToCart(authed, body);

        expect(res.status()).toBe(404);
        expect(await res.json()).toEqual({ success: false, message: messages.productDoesNotExist });
        expect(await (await apiGetCart(authed)).json()).toEqual([]);
      });
    }

    for (const c of cart.invalidQuantities) {
      test(`rejects ${c.label} with 400 and leaves the cart unchanged`, async ({ authed }) => {
        // KNOWN APPLICATION DEFECT: POST cart stores qty verbatim with no validation. Reproduce (curl, 2026-11-19):
        //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":-1}     -> 200 [..., {"productId":"34sLtEcMpzabRyfx","qty":-1}]
        //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":"abc"}  -> 200 [..., {"productId":"34sLtEcMpzabRyfx","qty":"abc"}]
        //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":1.5}    -> 200 (also stored)
        //   POST cart {"productId":"34sLtEcMpzabRyfx"}              -> 200 [..., {"productId":"34sLtEcMpzabRyfx"}]
        // A negative qty can make the cart total (and potentially the checkout charge) negative.
        // Expected: 400 {success:false, message}; cart unchanged. Remove test.fixme once the backend validates qty.
        test.fixme(true, 'App defect: POST cart accepts negative, non-numeric and missing qty (200, stored as-is)');
        test.info().annotations.push({ type: 'defect', description: 'No server-side qty validation on POST cart.' });

        const body: CartItemInput = { productId: book.productId };
        if ('qty' in c) body.qty = c.qty;

        const res = await apiAddToCart(authed, body);

        expect(res.status()).toBe(400);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
        expect(await (await apiGetCart(authed)).json()).toEqual([]);
      });
    }

    const stockCases = [
      { label: 'an out-of-stock product', productId: cart.outOfStockProductId, qty: 1 },
      { label: 'a qty far beyond available stock', productId: book.productId, qty: cart.beyondStockQty },
    ];
    for (const c of stockCases) {
      test(`rejects ${c.label}`, async ({ authed }) => {
        // KNOWN APPLICATION DEFECT (requirement to confirm with the product owner): GET products exposes a
        // `stock` field, but POST cart ignores it. Reproduce (curl, 2026-11-19):
        //   GET products -> "Nike Mens Running Shoes" _id 3W0jAAeDJmlZCF8i has "stock":0
        //   POST cart {"productId":"3W0jAAeDJmlZCF8i","qty":1}    -> 200 [{"productId":"3W0jAAeDJmlZCF8i","qty":1}]
        //   POST cart {"productId":"34sLtEcMpzabRyfx","qty":11}   -> 200 (book has "stock":10)
        // Expected: a 4xx {success:false, message}; cart unchanged.
        test.fixme(true, 'App defect: POST cart ignores product stock (out-of-stock and over-stock quantities accepted)');
        test.info().annotations.push({ type: 'defect', description: 'POST cart does not enforce product stock.' });

        const res = await apiAddToCart(authed, { productId: c.productId, qty: c.qty });

        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
        expect(await (await apiGetCart(authed)).json()).toEqual([]);
      });
    }

    test('a syntactically invalid JSON body -> 400 and the cart is unchanged', async ({ authed }) => {
      const res = await apiPostRawJson(authed, paths.cart, testData.api.malformedJsonBody);

      expect(res.status()).toBe(400);
      expect(await (await apiGetCart(authed)).json()).toEqual([]);
    });

    test('a syntactically invalid JSON body -> 400 with the JSON error envelope', async ({ authed }) => {
      // KNOWN APPLICATION DEFECT (minor, API contract; same as auth/login in auth.spec.ts). Reproduce (curl, 2026-11-19):
      //   POST cart -H "Authorization: Bearer <valid>" -H "Content-Type: application/json" --data-binary '{"username":'
      //   -> 400, Content-Type: text/html; charset=utf-8, body "<!DOCTYPE html>...<pre>Bad Request</pre>..."
      // Expected: 400, Content-Type application/json, {success:false, message}.
      test.fixme(true, 'App defect: malformed JSON body returns an HTML error page instead of the JSON error envelope');
      test.info().annotations.push({ type: 'defect', description: 'Malformed JSON -> 400 text/html, not JSON.' });

      const res = await apiPostRawJson(authed, paths.cart, testData.api.malformedJsonBody);

      expect(res.status()).toBe(400);
      expect(res.headers()['content-type']).toContain('application/json');
      expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
    });
  });

  test.describe('update and remove', () => {
    test('re-posting a product in the cart sets its qty (does not add a line or increment)', async ({ authed }) => {
      await test.step('add', async () => {
        expect((await apiAddToCart(authed, { productId: book.productId, qty: book.qty })).status()).toBe(200);
      });

      await test.step('update qty', async () => {
        const res = await apiUpdateCartQty(authed, book.productId, cart.updatedQty);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([{ productId: book.productId, qty: cart.updatedQty }]);
      });

      expect(await (await apiGetCart(authed)).json()).toEqual([{ productId: book.productId, qty: cart.updatedQty }]);
    });

    test('qty 0 removes only that product from the cart', async ({ authed }) => {
      await test.step('add two products', async () => {
        for (const p of PRODUCTS) {
          expect((await apiAddToCart(authed, { productId: p.productId, qty: p.qty })).status()).toBe(200);
        }
      });

      await test.step('remove book', async () => {
        const res = await apiRemoveFromCart(authed, book.productId);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([{ productId: roadster.productId, qty: roadster.qty }]);
      });

      expect(await (await apiGetCart(authed)).json()).toEqual([{ productId: roadster.productId, qty: roadster.qty }]);
    });

    test('qty 0 for a product not in the cart does not add it', async ({ authed }) => {
      // KNOWN APPLICATION DEFECT: removing a product that is not in the cart adds it with qty 1.
      // Reproduce (curl, 2026-11-19), fresh user with GET cart -> []:
      //   POST cart {"productId":"3W0jAAeDJmlZCF8","qty":0}  -> 200 [{"productId":"3W0jAAeDJmlZCF8","qty":1}]
      //   GET cart                                            -> 200 [{"productId":"3W0jAAeDJmlZCF8","qty":1}]
      // Expected: 200 [] (no-op) or a 4xx; the cart must stay empty. A stale "remove" from a second tab
      // therefore puts the item back in the cart and it gets charged at checkout.
      test.fixme(true, 'App defect: POST cart with qty 0 for a product not in the cart adds it with qty 1');
      test.info().annotations.push({ type: 'defect', description: 'Remove (qty 0) of an absent product adds it with qty 1.' });

      const res = await apiRemoveFromCart(authed, roadster.productId);

      expect(res.status()).toBeLessThan(500);
      expect(await (await apiGetCart(authed)).json()).toEqual([]);
    });
  });

  test.describe('auth', () => {
    const calls = [
      { label: 'GET cart', send: apiGetCart },
      {
        label: 'POST cart',
        send: (req: Parameters<typeof apiGetCart>[0], headers?: Record<string, string>) =>
          apiAddToCart(req, { productId: book.productId, qty: book.qty }, headers),
      },
    ];
    const missingTokenCases = [
      { label: 'no Authorization header', headers: (_token: string) => ({}) },
      { label: 'a token without the Bearer prefix', headers: (token: string) => ({ Authorization: token }) },
    ];

    for (const call of calls) {
      for (const c of missingTokenCases) {
        test(`${call.label} with ${c.label} -> 401`, async ({ request, apiUser, authed }) => {
          const res = await call.send(request, c.headers(apiUser.token));

          expect(res.status()).toBe(401);
          expect(await res.json()).toEqual({ success: false, message: messages.bearerTokenNotFound });
          expect(await (await apiGetCart(authed)).json()).toEqual([]);
        });
      }

      for (const c of cart.malformedTokens) {
        test(`${call.label} with ${c.label} is rejected without touching the cart`, async ({ request, apiUser, authed }) => {
          const token = c.tamperSignature ? tamper(apiUser.token) : c.token!;

          const res = await call.send(request, bearer(token));

          expect(res.ok()).toBe(false);
          expect(await res.json()).toEqual({ success: false, message: messages.badOrExpiredToken });
          expect(await (await apiGetCart(authed)).json()).toEqual([]);
        });

        test(`${call.label} with ${c.label} -> 401`, async ({ request, apiUser }) => {
          // KNOWN APPLICATION DEFECT: an invalid/tampered Bearer token gets 400, while a missing token gets 401.
          // Reproduce (curl, 2026-11-19):
          //   GET cart  -H "Authorization: Bearer garbage"                       -> 400 {"success":false,"message":"Bad or expired token"}
          //   GET cart  -H "Authorization: Bearer <real header.payload>.AAAA..."  -> 400 (same body)
          //   POST cart -H "Authorization: Bearer garbage" (valid body)          -> 400 (same body)
          // Expected: 401 (RFC 6750 §3.1: invalid_token -> 401 Unauthorized). 400 also means clients that log the
          // user out on 401 keep an expired session instead of sending them to login.
          test.fixme(true, 'App defect: invalid/expired Bearer token returns 400 instead of 401');
          test.info().annotations.push({ type: 'defect', description: 'Bad token -> 400, should be 401.' });

          const token = c.tamperSignature ? tamper(apiUser.token) : c.token!;

          const res = await call.send(request, bearer(token));

          expect(res.status()).toBe(401);
          expect(await res.json()).toEqual({ success: false, message: messages.badOrExpiredToken });
        });
      }
    }

    test("carts are per user: B sees an empty cart and B's changes to the same product do not touch A's cart", async ({ authed, otherAuthed }) => {
      const cartOfA = PRODUCTS.map(({ productId, qty }) => ({ productId, qty }));
      await test.step('A adds two products', async () => {
        for (const item of cartOfA) expect((await apiAddToCart(authed, item)).status()).toBe(200);
      });

      await test.step("B's cart is empty", async () => {
        const res = await apiGetCart(otherAuthed);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([]);
      });

      await test.step('B adds the same product with a different qty', async () => {
        const res = await apiAddToCart(otherAuthed, { productId: book.productId, qty: cart.isolationQty });
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([{ productId: book.productId, qty: cart.isolationQty }]);
      });

      await test.step("A's cart is unchanged after B's add", async () => {
        const items = await (await apiGetCart(authed)).json();
        expect(items).toHaveLength(cartOfA.length);
        expect(items).toEqual(expect.arrayContaining(cartOfA));
      });

      await test.step('B removes the product', async () => {
        const res = await apiRemoveFromCart(otherAuthed, book.productId);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([]);
      });

      await test.step("A's cart is unchanged after B's remove", async () => {
        const items = await (await apiGetCart(authed)).json();
        expect(items).toHaveLength(cartOfA.length);
        expect(items).toEqual(expect.arrayContaining(cartOfA));
      });
    });
  });
});
