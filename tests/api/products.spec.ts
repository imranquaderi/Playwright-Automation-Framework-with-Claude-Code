import { test, expect } from './fixtures';
import { apiGetProduct, apiGetProducts, apiSearchProducts, bearer, Product } from '../helpers/api';
import { testData } from '../helpers/data';

const { products: data } = testData.api;
const { search } = data;
type ProductKey = keyof typeof testData.products;
type Req = Parameters<typeof apiGetProducts>[0];

/** The whole catalogue from GET products; used to resolve ids at runtime and as the oracle for search. */
async function catalogue(req: Req): Promise<Product[]> {
  const res = await apiGetProducts(req);
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()) as Product[];
}

/** What a search for `term` should return: every product whose name or category contains it, case-insensitively. */
const matching = (all: Product[], term: string) =>
  all.filter((p) => `${p.name}\n${p.category}`.toLowerCase().includes(term.toLowerCase()));

/** Order-insensitive comparison key: search keeps catalogue order today, but nothing promises it. */
const byId = (list: Product[]) => [...list].sort((a, b) => a._id.localeCompare(b._id));

test.describe('API: products', () => {
  test.describe('listing', () => {
    test('returns a non-empty array where every product has the expected fields and types', async ({ request }) => {
      const res = await apiGetProducts(request);

      expect(res.status()).toBe(200);
      const all = (await res.json()) as Product[];
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
      for (const p of all) {
        expect(p, p.name).toMatchObject({
          _id: expect.any(String),
          name: expect.any(String),
          category: expect.any(String),
          cost: expect.any(Number),
          rating: expect.any(Number),
          image: expect.any(String),
          stock: expect.any(Number),
        });
        expect(p._id, p.name).not.toBe('');
        expect(p.name.trim(), p._id).not.toBe('');
        expect(p.cost, p.name).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(p.stock), `${p.name} stock ${p.stock}`).toBe(true);
        expect(p.stock, p.name).toBeGreaterThanOrEqual(0);
      }
    });

    test('every product has a unique _id', async ({ request }) => {
      const ids = (await catalogue(request)).map((p) => p._id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    for (const key of data.known as ProductKey[]) {
      const { name, price } = testData.products[key] as { name: string; price: number };

      test(`lists "${name}" at $${price}`, async ({ request }) => {
        const all = await catalogue(request);

        expect(all.find((p) => p.name === name)).toMatchObject({ name, cost: price });
      });
    }

    test('returns the whole catalogue the UI paginates over (page 1 + page 2 products)', async ({ request }) => {
      // Pagination is client-side: the UI shows `page1Count` cards on page 1 and `page2Products` on page 2.
      const { page1Count, page2Products } = testData.productListing;
      const names = (await catalogue(request)).map((p) => p.name);

      expect(names.length).toBeGreaterThanOrEqual(page1Count + page2Products.length);
      expect(names).toEqual(expect.arrayContaining(page2Products));
    });

    test('ignores pagination query params and still returns the whole catalogue', async ({ request }) => {
      const all = await catalogue(request);

      const res = await apiGetProducts(request, data.ignoredPagination);

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual(all);
    });

    test('is public: a malformed Bearer token is ignored', async ({ request }) => {
      const all = await catalogue(request);

      const res = await request.get(testData.api.paths.products, { headers: bearer(testData.api.cart.malformedTokens[0].token!) });

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual(all);
    });
  });

  test.describe('single product', () => {
    // Nike's GET products/:id is covered in cart-nike.spec.ts; these use the other known products.
    for (const key of data.known as ProductKey[]) {
      const { name } = testData.products[key];

      test(`GET products/:id for "${name}" returns the same product as the listing`, async ({ request }) => {
        const listed = (await catalogue(request)).find((p) => p.name === name);
        expect(listed, `"${name}" in GET products`).toBeDefined();

        const res = await apiGetProduct(request, listed!._id);

        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual(listed);
      });
    }

    for (const c of data.badIds) {
      test(`GET products/:id with ${c.label} -> 404`, async ({ request }) => {
        const res = await apiGetProduct(request, c.id);

        // Observed body is empty (Content-Length: 0); only the status is part of the contract here.
        expect(res.status()).toBe(404);
      });
    }
  });

  test.describe('search', () => {
    for (const c of search.nameTerms) {
      test(`matches product names by ${c.label} ("${c.term}")`, async ({ request }) => {
        const all = await catalogue(request);

        const res = await apiSearchProducts(request, c.term);

        expect(res.status()).toBe(200);
        const found = (await res.json()) as Product[];
        const expectedNames = c.expected.map((k) => testData.products[k as ProductKey].name);
        expect(found.map((p) => p.name).sort()).toEqual([...expectedNames].sort());
        expect(byId(found)).toEqual(byId(matching(all, c.term)));
      });
    }

    for (const category of search.categoryTerms) {
      test(`matches by category ("${category}") and returns every product in it`, async ({ request }) => {
        const all = await catalogue(request);
        const inCategory = all.filter((p) => p.category === category);
        expect(inCategory.length, `products in "${category}"`).toBeGreaterThan(0);

        const res = await apiSearchProducts(request, category);

        expect(res.status()).toBe(200);
        const found = (await res.json()) as Product[];
        expect(byId(found)).toEqual(byId(matching(all, category)));
        expect(found).toEqual(expect.arrayContaining(inCategory));
      });
    }

    for (const c of search.caseVariants) {
      test(`is case-insensitive ("${c.term}" vs ${c.variants.map((v) => `"${v}"`).join(', ')})`, async ({ request }) => {
        const baseline = await apiSearchProducts(request, c.term);
        expect(baseline.status()).toBe(200);
        const expected = byId(await baseline.json());
        expect(expected.length).toBeGreaterThan(0);

        for (const variant of c.variants) {
          await test.step(variant, async () => {
            const res = await apiSearchProducts(request, variant);
            expect(res.status()).toBe(200);
            expect(byId(await res.json())).toEqual(expected);
          });
        }
      });
    }

    test('every result contains the search term in its name or category', async ({ request }) => {
      const terms = [...search.nameTerms.map((c) => c.term), ...search.categoryTerms];

      for (const term of terms) {
        await test.step(term, async () => {
          const res = await apiSearchProducts(request, term);
          expect(res.status()).toBe(200);
          for (const p of (await res.json()) as Product[]) {
            expect(`${p.name}\n${p.category}`.toLowerCase(), `${p.name} for "${term}"`).toContain(term.toLowerCase());
          }
        });
      }
    });

    test('returns 404 with an empty array when nothing matches', async ({ request }) => {
      // The frontend relies on this 404 to show "No products found".
      const res = await apiSearchProducts(request, search.noResultTerm);

      expect(res.status()).toBe(404);
      expect(await res.json()).toEqual([]);
    });

    test('an empty value returns the whole catalogue', async ({ request }) => {
      const all = await catalogue(request);

      const res = await apiSearchProducts(request, '');

      expect(res.status()).toBe(200);
      expect(byId(await res.json())).toEqual(byId(all));
    });

    test('a missing value param is rejected with 400', async ({ request }) => {
      // KNOWN APPLICATION DEFECT: the handler does not validate the query string.
      // Reproduce (curl, 2026-11-19):
      //   GET products/search             -> 500 text/html "<pre>Internal Server Error</pre>"
      //   GET products/search?valu=shoes  -> 500 (same)
      // Expected: 400 {success:false, message} (or the same result as an empty value), never a 500.
      test.fixme(true, 'App defect: GET products/search without a value param -> 500 Internal Server Error (HTML)');
      test.info().annotations.push({ type: 'defect', description: 'Missing `value` query param crashes the search handler.' });

      const res = await apiSearchProducts(request, undefined);

      expect(res.status()).toBe(400);
      expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
    });

    for (const c of search.specialCharacterTerms) {
      test(`matches ${c.label} ("${c.term}") literally: no product contains it -> 404 []`, async ({ request }) => {
        // KNOWN APPLICATION DEFECT for the cases with `defect` set: the term is not treated as plain text.
        // Reproduce (curl, 2026-11-19); no product name or category contains ', ", (, [, *, + or ?:
        //   GET products/search?value=%27   (')  -> 200 with all 21 products (also for %22 ")
        //   GET products/search?value=(           -> 500 text/html Internal Server Error (also [, \, *, +, ?)
        //   GET products/search?value=.*          -> 200 with all 21 products; value=s.oes -> 200 both running shoes
        // Expected: the term is matched literally (regex-escaped), so these return 404 [] like any other non-match.
        test.fixme(!!c.defect, `App defect: GET products/search?value=${c.term} -> ${c.defect}`);
        const all = await catalogue(request);
        expect(matching(all, c.term), `catalogue products containing "${c.term}"`).toEqual([]);

        const res = await apiSearchProducts(request, c.term);

        expect(res.status()).toBe(404);
        expect(await res.json()).toEqual([]);
      });
    }
  });
});
