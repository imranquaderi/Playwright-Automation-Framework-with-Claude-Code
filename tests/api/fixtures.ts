import { test as base, expect, APIRequest, APIRequestContext } from '@playwright/test';
import { PASSWORD, uniqueUsername } from '../helpers/auth';
import { apiLogin, apiRegister, bearer, LoginResponse } from '../helpers/api';

export interface ApiUser {
  username: string;
  password: string;
  token: string;
  balance: number;
}

type ApiFixtures = {
  /** A brand-new user, registered and logged in through the API. One per test. */
  apiUser: ApiUser;
  /** Request context that sends the apiUser's Bearer token on every call. Disposed after the test. */
  authed: APIRequestContext;
  /** A second brand-new user (user B), for isolation tests. Only created when a test asks for it. */
  otherUser: ApiUser;
  /** Request context authenticated as otherUser. Disposed after the test. */
  otherAuthed: APIRequestContext;
};

async function createUser(request: APIRequestContext): Promise<ApiUser> {
  const username = uniqueUsername();
  const password = PASSWORD;

  const registered = await apiRegister(request, { username, password });
  expect(registered.status(), `register ${username}: ${await registered.text()}`).toBe(201);

  const loggedIn = await apiLogin(request, { username, password });
  expect(loggedIn.status(), `login ${username}: ${await loggedIn.text()}`).toBe(201);
  const { token, balance } = (await loggedIn.json()) as LoginResponse;

  return { username, password, token, balance };
}

async function authedContext(request: APIRequest, baseURL: string | undefined, user: ApiUser) {
  return request.newContext({ baseURL, extraHTTPHeaders: bearer(user.token) });
}

export const test = base.extend<ApiFixtures>({
  apiUser: async ({ request }, use) => {
    await use(await createUser(request));
  },

  authed: async ({ playwright, apiUser, baseURL }, use) => {
    const ctx = await authedContext(playwright.request, baseURL, apiUser);
    await use(ctx);
    await ctx.dispose();
  },

  otherUser: async ({ request }, use) => {
    await use(await createUser(request));
  },

  otherAuthed: async ({ playwright, otherUser, baseURL }, use) => {
    const ctx = await authedContext(playwright.request, baseURL, otherUser);
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
