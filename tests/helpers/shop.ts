import { expect, Page } from '@playwright/test';
import { PASSWORD, uniqueUsername, registerUser, login } from './auth';
import { testData, text, exactText, escapeRegex, urlEndsWith, fill } from './data';

const { routes, labels, messages } = testData;

/** Product names exactly as rendered (note the comma in "Thinking, Fast and Slow"). */
export const PRODUCTS = Object.fromEntries(
  Object.entries(testData.products).map(([key, product]) => [key, product.name]),
) as { [K in keyof typeof testData.products]: string };

export const PAGE_1_COUNT = testData.productListing.page1Count;
export const PAGE_2_PRODUCTS = testData.productListing.page2Products;

export const VALID_ADDRESS = testData.addresses.valid;

/** Registers a brand-new user, logs in and waits until the logged-in header is shown. Returns the username. */
export async function newLoggedInUser(page: Page): Promise<string> {
  const username = uniqueUsername();
  await registerUser(page, username, PASSWORD);
  await login(page, username, PASSWORD);
  await expect(page.getByText(text(messages.loggedInSuccessfully))).toBeVisible();
  await expect(page).toHaveURL(urlEndsWith(routes.home));
  await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
  return username;
}

/** Logs out via the header and logs the given user back in. */
export async function relogin(page: Page, username: string) {
  await page.getByRole('button', { name: text(labels.logoutButton) }).click();
  await expect(page.getByRole('button', { name: exactText(labels.headerLoginButton) })).toBeVisible();
  await page.goto(routes.login);
  await login(page, username, PASSWORD);
  await expect(page.getByRole('button', { name: text(labels.logoutButton) })).toBeVisible();
}

/**
 * Notistack toasts auto-dismiss after ~2s, which can elapse before a slow page.goto() resolves.
 * Start listening before the action so a short-lived toast is never missed.
 */
export async function expectToastDuring(page: Page, text: RegExp, action: () => Promise<unknown>) {
  const seen = page.getByText(text).first().waitFor({ state: 'visible', timeout: 15_000 });
  await action();
  await seen;
}

export async function getStorage(page: Page) {
  return page.evaluate(() => ({
    username: localStorage.getItem('username'),
    token: localStorage.getItem('token'),
    balance: localStorage.getItem('balance'),
  }));
}

/* ---------------------------- product listing ---------------------------- */

export const productCards = (page: Page) => page.locator('.card');

export const productCard = (page: Page, name: string) =>
  productCards(page).filter({ has: page.getByText(new RegExp(`^\\s*${escapeRegex(name)}\\s*$`)) });

export const searchBox = (page: Page) => page.locator('.search-desktop input');

/**
 * Waits for the listing to render before typing: otherwise the initial product fetch can land
 * after the debounced search and overwrite its results.
 */
export async function search(page: Page, term: string) {
  await expect(productCards(page).first().or(page.getByText(text(messages.noProductsFound)))).toBeVisible();
  await searchBox(page).fill(term);
}

/* --------------------------------- cart --------------------------------- */

/** The cart side panel on "/" (the first .cart box; on /checkout the second .cart box is Order Details). */
export const cartPanel = (page: Page) => page.locator('.cart').first();

export const cartRows = (page: Page) => cartPanel(page).locator('.image-container').locator('..');

export const cartRow = (page: Page, name: string) => cartRows(page).filter({ hasText: name });

export const cartTotal = (page: Page) => page.getByTestId('cart-total');

export const EMPTY_CART = text(messages.emptyCart);

/** Cart row +/- are icon-only buttons: first is "-", second is "+". */
export const decreaseBtn = (page: Page, name: string) => cartRow(page, name).getByRole('button').nth(0);
export const increaseBtn = (page: Page, name: string) => cartRow(page, name).getByRole('button').nth(1);
export const itemQty = (page: Page, name: string) => cartRow(page, name).getByTestId('item-qty');

/** Adds a product from the currently visible product page and waits for it to appear in the cart. */
export async function addToCart(page: Page, name: string) {
  await productCard(page, name).getByRole('button', { name: text(labels.addToCart) }).click();
  await expect(cartRow(page, name)).toBeVisible();
}

/** Clicks "+" until the line reaches `qty`, waiting for each server round-trip. */
export async function setQty(page: Page, name: string, qty: number) {
  let current = Number(await itemQty(page, name).innerText());
  while (current < qty) {
    await increaseBtn(page, name).click();
    current += 1;
    await expect(itemQty(page, name)).toHaveText(String(current));
  }
  while (current > qty) {
    await decreaseBtn(page, name).click();
    current -= 1;
    if (current > 0) await expect(itemQty(page, name)).toHaveText(String(current));
  }
}

/**
 * /checkout loads saved addresses via GET /user/addresses. If an address is added before that
 * response lands, the (stale, empty) response overwrites the list. Always wait for it.
 */
const addressesLoaded = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === 'GET' && r.url().includes(routes.addressesApi));

/** Clicks the cart's Checkout button and waits until saved addresses have loaded. */
export async function goToCheckout(page: Page) {
  const loaded = addressesLoaded(page);
  await cartPanel(page).getByRole('button', { name: text(labels.checkout) }).click();
  await loaded;
  await expect(page).toHaveURL(urlEndsWith(routes.checkout));
  await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();
}

/** Navigates straight to /checkout (logged-in) and waits until saved addresses have loaded. */
export async function openCheckout(page: Page) {
  const loaded = addressesLoaded(page);
  await page.goto(routes.checkout);
  await loaded;
  await expect(page.getByRole('heading', { name: labels.shippingHeading })).toBeVisible();
}

/* ------------------------------- checkout ------------------------------- */

export const addressItems = (page: Page) => page.locator('.address-item');
export const addressItem = (page: Page, text: string) => addressItems(page).filter({ hasText: text });
export const addressInput = (page: Page) => page.getByPlaceholder(labels.addressPlaceholder);
export const placeOrderBtn = (page: Page) => page.getByRole('button', { name: text(labels.placeOrder) });
/** The UI may render a line break after the first sentence, so allow any whitespace there. */
export const NO_ADDRESSES = new RegExp(escapeRegex(messages.noAddresses).replace(/\\\. /g, '\\.\\s*'), 'i');

export async function openAddressForm(page: Page) {
  await page.getByRole('button', { name: text(labels.addNewAddress) }).click();
  await expect(addressInput(page)).toBeVisible();
}

/** Adds a valid address and waits until it is listed. */
export async function addAddress(page: Page, address: string) {
  await openAddressForm(page);
  await addressInput(page).fill(address);
  const saved = page.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().includes(routes.addressesApi),
  );
  await page.getByRole('button', { name: exactText(labels.addAddressButton) }).click();
  expect((await saved).ok()).toBeTruthy();
  await expect(addressItem(page, address)).toBeVisible();
}

export async function selectAddress(page: Page, address: string) {
  const radio = addressItem(page, address).locator('input[name="address"]');
  await radio.check();
  await expect(radio).toBeChecked();
}

export const paymentText = (page: Page, total: number, balance: number) =>
  page.getByText(text(fill(messages.paymentSummary, { total, balance })));

/** Full happy path: user's cart must already be populated and the page on "/". Ends on /thanks. */
export async function checkoutWithNewAddress(page: Page, address = VALID_ADDRESS) {
  await goToCheckout(page);
  await addAddress(page, address);
  await selectAddress(page, address);
  await placeOrderBtn(page).click();
  await expect(page.getByText(text(messages.orderPlacedSuccessfully))).toBeVisible();
  await expect(page).toHaveURL(urlEndsWith(routes.thanks));
}

/** Adds Sofa ($650) + Thinking, Fast and Slow ($15) + Roadster ($30) = $695. */
export async function addStandardCart(page: Page) {
  await addToCart(page, PRODUCTS.sofa);
  await addToCart(page, PRODUCTS.book);
  await addToCart(page, PRODUCTS.roadster);
  await expect(cartTotal(page)).toHaveText(testData.cart.standardCartTotal);
}
