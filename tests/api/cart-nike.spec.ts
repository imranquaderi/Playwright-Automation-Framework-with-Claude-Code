import { test as base, expect } from './fixtures';
import { apiAddToCart, apiFindProductByName, apiGetCart, apiGetProduct, Product } from '../helpers/api';
import { testData } from '../helpers/data';

const { messages, nike: nikeData } = testData.api;
const NIKE_NAME = testData.products.nike.name;

/**
 * `nike` is resolved by name from GET products for every test, so these specs do not depend on a fixed
 * product id or on the current stock level of the shared QA catalogue.
 */
const test = base.extend<{ nike: Product }>({
  nike: async ({ request }, use) => {
    const product = await apiFindProductByName(request, NIKE_NAME);
    expect(product, `"${NIKE_NAME}" is missing from GET products`).toBeDefined();
    await use(product!);
  },
});

test.describe('API: cart', () => {
  test.describe('Nike Mens Running Shoes', () => {
    test.describe('product', () => {
      test('is listed in GET products with the expected details', async ({ nike }) => {
        expect(nike).toMatchObject({
          _id: expect.any(String),
          name: NIKE_NAME,
          category: nikeData.category,
          cost: nikeData.cost,
          rating: expect.any(Number),
          image: expect.any(String),
          sizes: nikeData.sizes,
          stock: expect.any(Number),
        });
        expect(Number.isInteger(nike.stock)).toBe(true);
        expect(nike.stock).toBeGreaterThanOrEqual(0);
      });

      test('GET products/:id returns the same product as the listing', async ({ request, nike }) => {
        const res = await apiGetProduct(request, nike._id);

        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual(nike);
      });
    });

    test.describe('add', () => {
      test('adds qty 1 when in stock and GET cart shows it', async ({ authed, nike }) => {
        // Branches on the live stock value: only meaningful while Nike has stock. With stock 0 the
        // "rejects a qty above current stock" test below covers the out-of-stock case instead.
        test.skip(nike.stock < 1, `"${NIKE_NAME}" has stock ${nike.stock}; in-stock add is not applicable`);
        const item = { productId: nike._id, qty: 1 };

        await test.step('add', async () => {
          const res = await apiAddToCart(authed, item);
          expect(res.status()).toBe(200);
          expect(await res.json()).toEqual([item]);
        });

        await test.step('cart contains Nike', async () => {
          const res = await apiGetCart(authed);
          expect(res.status()).toBe(200);
          expect(await res.json()).toEqual([item]);
        });
      });

      test('rejects a qty above current stock (stock + 1) and leaves the cart empty', async ({ authed, nike }) => {
        // KNOWN APPLICATION DEFECT (same root cause as the stock case in cart.spec.ts): POST cart ignores
        // `stock`. While Nike's stock is 0, stock + 1 = 1, so this is the out-of-stock case.
        // Reproduce (curl, 2026-11-19), fresh user with GET cart -> []:
        //   GET products -> "Nike Mens Running Shoes" _id 3W0jAAeDJmlZCF8i "stock":0 "cost":80
        //   POST cart {"productId":"3W0jAAeDJmlZCF8i","qty":1}  -> 200 [{"productId":"3W0jAAeDJmlZCF8i","qty":1}]
        //   POST cart {"productId":"3W0jAAeDJmlZCF8i","qty":2}  -> 200 [{"productId":"3W0jAAeDJmlZCF8i","qty":2}]
        // Expected: a 4xx {success:false, message}; cart stays []. An out-of-stock shoe can be bought at checkout.
        test.fixme(true, 'App defect: POST cart accepts Nike Mens Running Shoes above its stock (stock 0, qty 1 -> 200)');
        test.info().annotations.push({ type: 'defect', description: 'POST cart does not enforce product stock.' });

        const res = await apiAddToCart(authed, { productId: nike._id, qty: nike.stock + 1 });

        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
        expect(await (await apiGetCart(authed)).json()).toEqual([]);
      });
    });

    test.describe('auth', () => {
      for (const c of nikeData.noBearerCases) {
        test(`adding Nike with ${c.label} -> 401 and nothing is added`, async ({ request, apiUser, authed, nike }) => {
          const headers: Record<string, string> = c.sendRawToken ? { Authorization: apiUser.token } : {};

          const res = await apiAddToCart(request, { productId: nike._id, qty: 1 }, headers);

          expect(res.status()).toBe(401);
          expect(await res.json()).toEqual({ success: false, message: messages.bearerTokenNotFound });
          expect(await (await apiGetCart(authed)).json()).toEqual([]);
        });
      }
    });
  });
});
