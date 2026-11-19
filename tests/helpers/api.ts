import type { APIRequestContext, APIResponse } from '@playwright/test';
import { testData } from './data';

/**
 * Thin client for the QKart backend. Each function sends one request and returns the raw
 * APIResponse; specs do all the asserting. Paths are relative (no leading slash) so the `api`
 * project's baseURL (.../api/v1/) is kept.
 */
const { paths } = testData.api;

export interface Credentials {
  username: string;
  password: string;
}

/** Body of a successful POST auth/login (201). */
export interface LoginResponse {
  success: true;
  token: string;
  username: string;
  balance: number;
}

/* --------------------------------- auth --------------------------------- */

/**
 * The backend rate-limits auth routes (429 "Too many requests", no RateLimit/Retry-After headers, window unknown).
 * Retry ONLY on 429 with exponential backoff + jitter (1s, 2s, 4s, 8s ~ 15s + jitter), honoring Retry-After when
 * present (capped at 10s per wait). Any other response is returned unchanged; if retries are exhausted the final
 * 429 is returned so the spec's assertion still reports it clearly.
 */
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_ATTEMPTS = 4;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function postWithRateLimitRetry(request: APIRequestContext, path: string, body: Partial<Credentials>): Promise<APIResponse> {
  let res = await request.post(path, { data: body });
  for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS && res.status() === 429; attempt++) {
    const retryAfterSec = Number(res.headers()['retry-after']);
    const wait = Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? Math.min(retryAfterSec * 1_000, 10_000)
      : RETRY_BASE_MS * 2 ** attempt + Math.floor(Math.random() * 500);
    await sleep(wait);
    res = await request.post(path, { data: body });
  }
  return res;
}

/** POST auth/register -> 201 {success:true} | 400 {success:false, message}. Partial bodies allowed for negative tests. Retries on 429. */
export function apiRegister(request: APIRequestContext, body: Partial<Credentials>): Promise<APIResponse> {
  return postWithRateLimitRetry(request, paths.register, body);
}

/** POST auth/login -> 201 LoginResponse | 400 {success:false, message}. Retries on 429. */
export function apiLogin(request: APIRequestContext, body: Partial<Credentials>): Promise<APIResponse> {
  return postWithRateLimitRetry(request, paths.login, body);
}

/** Header that authenticates a protected route (confirmed: `Authorization: Bearer <jwt>`). */
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/* ------------------------------- products ------------------------------- */

/** One product as returned by GET products / GET products/:id (confirmed shape). */
export interface Product {
  _id: string;
  name: string;
  category: string;
  cost: number;
  rating: number;
  image: string;
  sizeChartType?: string;
  sizes?: number[];
  stock: number;
}

/**
 * GET products -> 200 Product[] (public; any Authorization header is ignored). Returns the whole catalogue:
 * pagination is client-side, so query params such as page/limit are ignored. `params` exists only to prove that.
 */
export function apiGetProducts(request: APIRequestContext, params?: Record<string, string | number>): Promise<APIResponse> {
  return request.get(paths.products, { params });
}

/** GET products/:id -> 200 Product (public, no auth). */
export function apiGetProduct(request: APIRequestContext, id: string): Promise<APIResponse> {
  return request.get(`${paths.products}/${encodeURIComponent(id)}`);
}

/**
 * GET products/search?value=<term> (public). Confirmed behavior: case-insensitive "contains" match on name OR
 * category -> 200 Product[]; no match -> 404 []; empty value -> 200 with the whole catalogue.
 * Pass `undefined` to omit the `value` param entirely (currently 500, see products.spec.ts).
 */
export function apiSearchProducts(request: APIRequestContext, value: string | undefined): Promise<APIResponse> {
  return request.get(paths.productSearch, value === undefined ? undefined : { params: { value } });
}

/**
 * Lookup helper, not an assertion target: resolves a product by exact name from GET products so specs
 * do not hard-code product ids. Throws if GET products is not 200; returns undefined if no product matches.
 */
export async function apiFindProductByName(request: APIRequestContext, name: string): Promise<Product | undefined> {
  const res = await apiGetProducts(request);
  if (res.status() !== 200) throw new Error(`GET ${paths.products} -> ${res.status()}: ${await res.text()}`);
  return ((await res.json()) as Product[]).find((p) => p.name === name);
}

/* --------------------------------- cart --------------------------------- */

/** One cart line as returned by GET/POST cart (confirmed shape; no ids or prices). */
export interface CartItem {
  productId: string;
  qty: number;
}

/** Body of POST cart. `qty` is `unknown` so specs can send invalid values on purpose. */
export interface CartItemInput {
  productId?: string;
  qty?: unknown;
}

/** Optional per-call headers, for auth-failure tests that bypass the `authed` context. */
type Headers = Record<string, string>;

/** GET cart -> 200 CartItem[] | 401 (no Bearer token) | 400 (bad token). */
export function apiGetCart(request: APIRequestContext, headers?: Headers): Promise<APIResponse> {
  return request.get(paths.cart, { headers });
}

/**
 * POST cart -> 200 with the whole updated cart (CartItem[]) | 404 {success:false, message} for an unknown product.
 * This is an upsert: it sets the product's qty (it does not increment), and qty 0 removes the line.
 * There is no PUT or DELETE on cart (both 404).
 */
export function apiAddToCart(request: APIRequestContext, body: CartItemInput, headers?: Headers): Promise<APIResponse> {
  return request.post(paths.cart, { data: body, headers });
}

/** POST cart with a new qty for a product that is already in the cart. */
export function apiUpdateCartQty(request: APIRequestContext, productId: string, qty: number): Promise<APIResponse> {
  return apiAddToCart(request, { productId, qty });
}

/** POST cart {productId, qty: 0}: removes the line. */
export function apiRemoveFromCart(request: APIRequestContext, productId: string): Promise<APIResponse> {
  return apiAddToCart(request, { productId, qty: 0 });
}

/* ------------------------------- addresses ------------------------------- */

/** One saved address as returned by GET/POST/DELETE user/addresses (confirmed shape). */
export interface Address {
  _id: string;
  address: string;
}

/** GET user/addresses -> 200 Address[] (own addresses only) | 401 (no Bearer token) | 400 (bad token). */
export function apiGetAddresses(request: APIRequestContext, headers?: Headers): Promise<APIResponse> {
  return request.get(paths.addresses, { headers });
}

/**
 * POST user/addresses {address} -> 200 with the whole updated list (Address[]) |
 * 400 {success:false, message} when shorter than 20 or longer than 128 characters.
 * `body` is loosely typed so specs can send malformed bodies on purpose.
 */
export function apiAddAddress(request: APIRequestContext, body: Record<string, unknown>, headers?: Headers): Promise<APIResponse> {
  return request.post(paths.addresses, { data: body, headers });
}

/** DELETE user/addresses/:id -> 200 with the remaining list (Address[]) | 404 {success:false, message} if not the caller's. */
export function apiDeleteAddress(request: APIRequestContext, id: string, headers?: Headers): Promise<APIResponse> {
  return request.delete(`${paths.addresses}/${encodeURIComponent(id)}`, { headers });
}

/* ------------------------------- checkout ------------------------------- */

/**
 * POST cart/checkout {addressId} -> 200 {success:true}; empties the cart and deducts the cart total from
 * the wallet (read the new balance from POST auth/login; there is no balance endpoint).
 * Failures: 400 "Cart is empty" | 400 "Address not set" | 404 "Bad address specified" |
 * 400 "Wallet balance not sufficient to place order".
 */
export function apiCheckout(request: APIRequestContext, body: { addressId?: string }, headers?: Headers): Promise<APIResponse> {
  return request.post(paths.checkout, { data: body, headers });
}

/* -------------------------------- raw body ------------------------------- */

/**
 * POST `path` with `body` sent byte-for-byte (a string `data` is not re-serialized by Playwright) and an explicit
 * `Content-Type: application/json`, for malformed-JSON tests. Extra headers (e.g. bearer()) are merged in.
 */
export function apiPostRawJson(request: APIRequestContext, path: string, body: string, headers?: Headers): Promise<APIResponse> {
  return request.post(path, { data: body, headers: { 'Content-Type': 'application/json', ...headers } });
}
