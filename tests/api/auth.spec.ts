import { randomUUID } from 'crypto';
import { test, expect } from './fixtures';
import { apiGetCart, apiLogin, apiPostRawJson, apiRegister, bearer } from '../helpers/api';
import { PASSWORD, uniqueUsername } from '../helpers/auth';
import { fill, testData } from '../helpers/data';

const { paths, messages, auth } = testData.api;
const TOKEN = new RegExp(testData.api.tokenPattern);
const INITIAL_BALANCE = testData.users.validUser.initialBalance;

/** Short usernames have a tiny namespace, so randomise them to avoid "already exists" masking the real check. */
const shortUsername = (length: number) => randomUUID().replace(/-/g, '').slice(0, length);

const jwtPayload = (token: string) =>
  JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as Record<string, unknown>;

test.describe('API: auth', () => {
  test.describe('register', () => {
    test('registers a new user', async ({ request }) => {
      const res = await apiRegister(request, { username: uniqueUsername(), password: PASSWORD });

      expect(res.status()).toBe(201);
      expect(await res.json()).toEqual({ success: true });
    });

    test('rejects a duplicate username', async ({ request, apiUser }) => {
      const res = await apiRegister(request, { username: apiUser.username, password: PASSWORD });

      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ success: false, message: messages.usernameAlreadyExists });
    });

    for (const c of auth.invalidRegistrations) {
      test(`rejects a ${c.label}`, async ({ request }) => {
        // KNOWN APPLICATION DEFECT: the backend does no length validation on register; the 6-character
        // minimums exist only in the frontend form. Reproduce (curl, 2026-11-19):
        //   POST auth/register {"username":"abc","password":"Test@12345"}   -> 201 {"success":true}
        //   POST auth/register {"username":"<unique>","password":"12345"}   -> 201 {"success":true}
        //   (also accepted: password "" and a body with no username at all)
        // Expected: 400 {success:false, message}. Remove test.fixme once the backend validates input.
        test.fixme(true, 'App defect: POST auth/register accepts usernames/passwords shorter than 6 characters (201)');
        test.info().annotations.push({ type: 'defect', description: 'No server-side length validation on register.' });

        const username = c.shortUsernameLength ? shortUsername(c.shortUsernameLength) : uniqueUsername();
        const password = c.password ?? PASSWORD;

        const res = await apiRegister(request, { username, password });

        expect(res.status()).toBe(400);
        expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
      });
    }

    test('rejects a request without a password with a 4xx', async ({ request }) => {
      // KNOWN APPLICATION DEFECT (do not un-fixme casually; it may take the shared QA backend down):
      // POST auth/register {"username":"<unique>"} (no "password" key) was immediately followed by
      // HTTP 502 "Bad Gateway" on every endpoint (register, login) for several seconds, after which
      // GET products returned 200 again. That suggests an unhandled error (likely hashing an undefined
      // password) crashes the server process. Observed once on 2026-11-19; deliberately not re-triggered.
      // Expected: 400 {success:false, message}.
      test.fixme(true, 'App defect: POST auth/register without a password appears to crash the backend (502 on all routes)');
      test.info().annotations.push({ type: 'defect', description: 'Register without password -> backend-wide 502.' });

      const res = await apiRegister(request, { username: uniqueUsername() });

      expect(res.status()).toBe(400);
      expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
    });

    // Observed (curl, 2026-11-19): usernames are case-sensitive. After registering "case_user_<ts>", registering
    // "CASE_USER_<ts>" -> 201, and each logs in with its own password and gets its own username back. That is a
    // consistent design choice (not a defect), so it is asserted as such: two distinct, independently loginable accounts.
    for (const c of auth.caseVariants) {
      test(`treats ${c.label} variant of an existing username as a distinct account`, async ({ request, apiUser }) => {
        const variant = c.transform === 'upper'
          ? apiUser.username.toUpperCase()
          : apiUser.username.charAt(0).toUpperCase() + apiUser.username.slice(1);
        expect(variant).not.toBe(apiUser.username);

        await test.step('register the variant with a different password', async () => {
          const res = await apiRegister(request, { username: variant, password: auth.wrongPassword });
          expect(res.status()).toBe(201);
          expect(await res.json()).toEqual({ success: true });
        });

        await test.step('the variant logs in with its own password as itself', async () => {
          const res = await apiLogin(request, { username: variant, password: auth.wrongPassword });
          expect(res.status()).toBe(201);
          expect(await res.json()).toMatchObject({ success: true, username: variant, balance: INITIAL_BALANCE });
        });

        await test.step("the original's password does not open the variant", async () => {
          const res = await apiLogin(request, { username: variant, password: apiUser.password });
          expect(res.status()).toBe(400);
          expect(await res.json()).toEqual({ success: false, message: messages.passwordIncorrect });
        });

        await test.step('the original still logs in as itself', async () => {
          const res = await apiLogin(request, { username: apiUser.username, password: apiUser.password });
          expect(res.status()).toBe(201);
          expect(await res.json()).toMatchObject({ success: true, username: apiUser.username });
        });
      });
    }

    // Observed (curl, 2026-11-19): spaces and HTML characters are accepted (201), stored verbatim and loginable.
    // Accepted as reasonable for a JSON API (output encoding is the client's job); asserted so a silent change shows up.
    for (const c of auth.specialUsernames) {
      test(`accepts a username containing ${c.label}, stores it verbatim and can log in`, async ({ request }) => {
        const username = fill(c.template, { suffix: uniqueUsername() });

        await test.step('register', async () => {
          const res = await apiRegister(request, { username, password: PASSWORD });
          expect(res.status()).toBe(201);
          expect(await res.json()).toEqual({ success: true });
        });

        const token = await test.step('login returns the exact username', async () => {
          const res = await apiLogin(request, { username, password: PASSWORD });
          expect(res.status()).toBe(201);
          const body = await res.json();
          expect(body).toMatchObject({ success: true, token: expect.stringMatching(TOKEN), username });
          return body.token as string;
        });

        await test.step('the token authenticates a protected route', async () => {
          expect((await apiGetCart(request, bearer(token))).status()).toBe(200);
        });
      });
    }

    // Observed (curl, 2026-11-19): 256- and 1000-character usernames and passwords -> 201, loginable, and the
    // password is not silently truncated (a login with only its first 72 characters -> 400). Either a 2xx with a
    // working login or a 4xx would be acceptable; a 5xx or an unusable account would be a defect.
    for (const c of auth.longCredentials) {
      test(`handles a ${c.label} username and password without error`, async ({ request }) => {
        const long = (prefix: string) => (prefix + auth.longCredentialFiller.repeat(c.length)).slice(0, c.length);
        const username = long(`${uniqueUsername()}_`);
        const password = long(PASSWORD);

        const res = await apiRegister(request, { username, password });
        expect(res.status(), await res.text()).toBeLessThan(500);
        test.skip(res.status() >= 400, `Backend rejected ${c.length}-character credentials with ${res.status()} (acceptable)`);

        await test.step('the account logs in with the full credentials', async () => {
          const login = await apiLogin(request, { username, password });
          expect(login.status()).toBe(201);
          expect(await login.json()).toMatchObject({ success: true, token: expect.stringMatching(TOKEN), username });
        });

        await test.step('a truncated password is rejected', async () => {
          const login = await apiLogin(request, { username, password: password.slice(0, auth.bcryptTruncationLength) });
          expect(login.status()).toBe(400);
          expect(await login.json()).toEqual({ success: false, message: messages.passwordIncorrect });
        });
      });
    }
  });

  test.describe('login', () => {
    test('logs in and returns a token, username and wallet balance', async ({ request }) => {
      const username = uniqueUsername();
      await test.step('register', async () => {
        expect((await apiRegister(request, { username, password: PASSWORD })).status()).toBe(201);
      });

      const body = await test.step('login', async () => {
        const res = await apiLogin(request, { username, password: PASSWORD });
        expect(res.status()).toBe(201);
        return res.json();
      });

      expect(body).toEqual({
        success: true,
        token: expect.stringMatching(TOKEN),
        username,
        balance: INITIAL_BALANCE,
      });
      expect(jwtPayload(body.token)).toMatchObject({ username, iat: expect.any(Number), exp: expect.any(Number) });
    });

    const failures = [
      { label: 'a wrong password', unknownUser: false, password: auth.wrongPassword, message: messages.passwordIncorrect },
      { label: 'an unknown username', unknownUser: true, password: PASSWORD, message: messages.usernameDoesNotExist },
    ];
    for (const c of failures) {
      test(`rejects ${c.label}`, async ({ request, apiUser }) => {
        const username = c.unknownUser ? uniqueUsername() : apiUser.username;

        const res = await apiLogin(request, { username, password: c.password });

        expect(res.status()).toBe(400);
        expect(await res.json()).toEqual({ success: false, message: c.message });
      });
    }

    test('issued token authenticates a protected route as Bearer', async ({ authed }) => {
      const res = await authed.get(paths.cart);

      expect(res.status()).toBe(200);
    });

    test('a syntactically invalid JSON body -> 400', async ({ request }) => {
      const res = await apiPostRawJson(request, paths.login, testData.api.malformedJsonBody);

      expect(res.status()).toBe(400);
    });

    test('a syntactically invalid JSON body -> 400 with the JSON error envelope', async ({ request }) => {
      // KNOWN APPLICATION DEFECT (minor, API contract): the body-parser error escapes the app's error handler, so the
      // client gets Express's default HTML page instead of the {success,message} JSON every other error uses.
      // Reproduce (curl, 2026-11-19):
      //   POST auth/login -H "Content-Type: application/json" --data-binary '{"username":'
      //   -> 400, Content-Type: text/html; charset=utf-8, body "<!DOCTYPE html>...<pre>Bad Request</pre>..."
      // Expected: 400, Content-Type application/json, {success:false, message}.
      test.fixme(true, 'App defect: malformed JSON body returns an HTML error page instead of the JSON error envelope');
      test.info().annotations.push({ type: 'defect', description: 'Malformed JSON -> 400 text/html, not JSON.' });

      const res = await apiPostRawJson(request, paths.login, testData.api.malformedJsonBody);

      expect(res.status()).toBe(400);
      expect(res.headers()['content-type']).toContain('application/json');
      expect(await res.json()).toMatchObject({ success: false, message: expect.any(String) });
    });
  });
});
