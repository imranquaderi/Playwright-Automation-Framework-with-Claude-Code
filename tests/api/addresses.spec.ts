import { test, expect } from './fixtures';
import { Address, apiAddAddress, apiDeleteAddress, apiGetAddresses, bearer } from '../helpers/api';
import { testData } from '../helpers/data';

const { messages, addresses } = testData.api;
const VALID = testData.addresses.valid;
const SECOND = addresses.second;

const ofLength = (n: number) => addresses.filler.repeat(n);
type Req = Parameters<typeof apiGetAddresses>[0];

/** Adds an address, asserts 200 and returns the saved entry. */
async function addOne(req: Req, address: string): Promise<Address> {
  const res = await apiAddAddress(req, { address });
  expect(res.status(), await res.text()).toBe(200);
  const saved = ((await res.json()) as Address[]).find((a) => a.address === address);
  expect(saved, `${address} in POST response`).toBeDefined();
  return saved!;
}

const listOf = async (req: Req) => (await (await apiGetAddresses(req)).json()) as Address[];

test.describe('API: addresses', () => {
  test.describe('list', () => {
    test('returns an empty list for a new user', async ({ authed }) => {
      const res = await apiGetAddresses(authed);

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });
  });

  test.describe('add', () => {
    test('adds an address and returns the full list with a generated id', async ({ authed }) => {
      await test.step('add', async () => {
        const res = await apiAddAddress(authed, { address: VALID });
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([{ _id: expect.any(String), address: VALID }]);
      });

      await test.step('list contains it', async () => {
        const res = await apiGetAddresses(authed);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([{ _id: expect.any(String), address: VALID }]);
      });
    });

    test('a second address is appended with its own id', async ({ authed }) => {
      const first = await addOne(authed, VALID);

      const res = await apiAddAddress(authed, { address: SECOND });

      expect(res.status()).toBe(200);
      const body = (await res.json()) as Address[];
      expect(body).toEqual([first, { _id: expect.any(String), address: SECOND }]);
      expect(body[1]._id).not.toBe(first._id);
      expect(await listOf(authed)).toEqual(body);
    });

    for (const c of addresses.validLengths) {
      test(`accepts an address at ${c.label} (${c.length} chars)`, async ({ authed }) => {
        // Current behaviour: the messages say "greater than 20" / "less than 128", but 20 and 128 are accepted
        // (the UI boundary test CHK-04 documents the same inconsistency).
        test.info().annotations.push({ type: 'inconsistency', description: 'Limits are inclusive (20..128) despite the wording.' });
        const address = ofLength(c.length);

        const res = await apiAddAddress(authed, { address });

        expect(res.status()).toBe(200);
        expect(await listOf(authed)).toEqual([{ _id: expect.any(String), address }]);
      });
    }

    for (const c of addresses.invalidLengths) {
      test(`rejects ${c.label} with 400 and saves nothing`, async ({ authed }) => {
        const res = await apiAddAddress(authed, { address: ofLength(c.length) });

        expect(res.status()).toBe(400);
        expect(await res.json()).toEqual({ success: false, message: messages[c.message as keyof typeof messages] });
        expect(await listOf(authed)).toEqual([]);
      });
    }

    for (const c of addresses.malformedBodies) {
      test(`rejects ${c.label} with 400 and saves nothing`, async ({ authed }) => {
        // KNOWN APPLICATION DEFECT: POST user/addresses only checks the length of `address`. Reproduce (curl, 2026-11-19):
        //   POST user/addresses {}                                     -> 500 "Internal Server Error" (HTML page)
        //   POST user/addresses {"address":"<25 spaces>"}              -> 200, stored as 25 spaces
        //   POST user/addresses {"address":123456789012345678901234}   -> 200, stored as the number 1.2345678901234569e+23
        // Expected: 400 {success:false, message}; nothing saved. A blank or numeric "address" can then be used at checkout.
        test.fixme(true, `App defect: POST user/addresses with ${c.label} -> ${c.observed}`);
        test.info().annotations.push({ type: 'defect', description: 'No type/presence/blank validation on POST user/addresses.' });

        const res = await apiAddAddress(authed, c.body);

        expect(res.status()).toBe(400);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
        expect(await listOf(authed)).toEqual([]);
      });
    }
  });

  test.describe('delete', () => {
    test('deletes only the given address and returns the remaining list', async ({ authed }) => {
      const first = await addOne(authed, VALID);
      const second = await addOne(authed, SECOND);

      await test.step('delete the first', async () => {
        const res = await apiDeleteAddress(authed, first._id);
        expect(res.status()).toBe(200);
        expect(await res.json()).toEqual([second]);
      });

      expect(await listOf(authed)).toEqual([second]);
    });

    const notFoundCases = [
      { label: 'an unknown id', deleteTwice: false },
      { label: 'an already-deleted id', deleteTwice: true },
    ];
    for (const c of notFoundCases) {
      test(`deleting ${c.label} -> 404 and leaves the list unchanged`, async ({ authed }) => {
        let id = addresses.unknownId;
        let remaining: Address[] = [];
        if (c.deleteTwice) {
          const kept = await addOne(authed, SECOND);
          id = (await addOne(authed, VALID))._id;
          expect((await apiDeleteAddress(authed, id)).status()).toBe(200);
          remaining = [kept];
        }

        const res = await apiDeleteAddress(authed, id);

        expect(res.status()).toBe(404);
        expect(await res.json()).toEqual({ success: false, message: messages.addressToDeleteNotFound });
        expect(await listOf(authed)).toEqual(remaining);
      });
    }
  });

  test.describe('user isolation', () => {
    // `authed` is user A, `otherAuthed` is a second fresh user B.
    test("user B does not see user A's addresses", async ({ authed, otherAuthed }) => {
      await addOne(authed, VALID);

      const res = await apiGetAddresses(otherAuthed);

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([]);
    });

    test("user B cannot delete user A's address (404, A's list unchanged)", async ({ authed, otherAuthed }) => {
      const owned = await addOne(authed, VALID);

      const res = await apiDeleteAddress(otherAuthed, owned._id);

      expect(res.status()).toBe(404);
      expect(await res.json()).toEqual({ success: false, message: messages.addressToDeleteNotFound });
      expect(await listOf(authed)).toEqual([owned]);
    });
  });

  test.describe('auth', () => {
    const calls = [
      { label: 'GET user/addresses', send: (req: Req, h?: Record<string, string>) => apiGetAddresses(req, h) },
      { label: 'POST user/addresses', send: (req: Req, h?: Record<string, string>) => apiAddAddress(req, { address: VALID }, h) },
      { label: 'DELETE user/addresses/:id', send: (req: Req, h?: Record<string, string>) => apiDeleteAddress(req, addresses.unknownId, h) },
    ];
    const missingTokenCases = [
      { label: 'no Authorization header', headers: (_token: string) => ({}) },
      { label: 'a token without the Bearer prefix', headers: (token: string) => ({ Authorization: token }) },
    ];
    const badToken = testData.api.cart.malformedTokens[0];

    for (const call of calls) {
      for (const c of missingTokenCases) {
        test(`${call.label} with ${c.label} -> 401 and saves nothing`, async ({ request, apiUser, authed }) => {
          const res = await call.send(request, c.headers(apiUser.token));

          expect(res.status()).toBe(401);
          expect(await res.json()).toEqual({ success: false, message: messages.bearerTokenNotFound });
          expect(await listOf(authed)).toEqual([]);
        });
      }

      test(`${call.label} with ${badToken.label} is rejected and saves nothing`, async ({ request, authed }) => {
        const res = await call.send(request, bearer(badToken.token!));

        expect(res.ok()).toBe(false);
        expect(await res.json()).toEqual({ success: false, message: messages.badOrExpiredToken });
        expect(await listOf(authed)).toEqual([]);
      });

      test(`${call.label} with ${badToken.label} -> 401`, async ({ request }) => {
        // KNOWN APPLICATION DEFECT (same as cart): an invalid Bearer token gets 400, a missing one 401. Reproduce (curl, 2026-11-19):
        //   GET    user/addresses      -H "Authorization: Bearer garbage" -> 400 {"success":false,"message":"Bad or expired token"}
        //   DELETE user/addresses/<id> -H "Authorization: Bearer garbage" -> 400 (same body)
        // Expected: 401 (RFC 6750 §3.1, invalid_token).
        test.fixme(true, 'App defect: invalid Bearer token returns 400 instead of 401');
        test.info().annotations.push({ type: 'defect', description: 'Bad token -> 400, should be 401.' });

        const res = await call.send(request, bearer(badToken.token!));

        expect(res.status()).toBe(401);
      });
    }
  });
});
