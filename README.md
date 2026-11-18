# Playwright Automation Framework with Claude Code

End-to-end test automation for the **QKart** e-commerce web app, built with [Playwright](https://playwright.dev) and TypeScript. The tests were planned, written and maintained with [Claude Code](https://claude.com/claude-code) and its Playwright agents.

The tests run against the deployed QA site, **https://crio-qkart-frontend-qa.vercel.app**. This repo has no application code, only tests.

![Playwright](https://img.shields.io/badge/Playwright-1.64-2EAD33?logo=playwright)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![CI](https://github.com/imranquaderi/Playwright-Automation-Framework-with-Claude-Code/actions/workflows/playwright.yml/badge.svg)

---

## Features

- **Tests run in three browsers.** Every test runs on Chromium, Firefox and WebKit.
- **Tests are independent and can run in parallel.** Each test registers its own new user with a unique username, so tests never share an account on the live backend.
- **Test data lives in JSON.** Routes, labels, messages, products and expected values are all in `tests/test-data/test_data.json`, not hard-coded in the specs.
- **Shared helpers keep the specs short.** Common flows (register, login, search, cart, checkout) and locators are written once in `tests/helpers/`.
- **Assertions retry automatically.** The tests use web-first assertions (`await expect(locator).toBeVisible()`) instead of fixed waits.
- **Claude Code agents are included.** Agents for planning, generating, fixing and reviewing tests are in `.claude/agents/`.
- **CI runs on GitHub Actions.** Tests run on every push and pull request, and the HTML report is uploaded with each run.

---

## Test coverage

| Area | Folder | What it covers |
| --- | --- | --- |
| Registration | `tests/registration/` | Valid sign-up, duplicate user, empty fields, short username or password, password mismatch, boundaries, navigation |
| Login | `tests/login/`, `tests/login.spec.ts` | Valid login, empty fields, case sensitivity, session persistence, logging in when already logged in |
| Header and navigation | `tests/header/` | Guest vs. logged-in header, logo, back-to-explore link, footer, logout |
| Products | `tests/products/` | Product listing, pagination, search (by name or category, case, clearing, no results), not-found page |
| Cart | `tests/cart/` | Add, add the same item twice, increase or decrease quantity, remove, multiple items, persistence, rapid clicks |
| Checkout | `tests/checkout/` | Adding, selecting and deleting addresses, address validation and boundaries, empty cart, wallet balance |
| Order | `tests/order/` | Placing an order, insufficient balance, exact balance, a second order, thank-you page, double submit |
| Access control | `tests/access/` | Guest restrictions, invalid tokens, back button after logout, user isolation |

---

## Project structure

```
.
├── .claude/agents/          # Claude Code agents: planner, generator, healer, test-improver
├── .github/workflows/       # GitHub Actions CI pipeline
├── specs/                   # Markdown test plans written by the planner agent
├── tests/
│   ├── helpers/
│   │   ├── auth.ts          # uniqueUsername(), registerUser(), login()
│   │   ├── data.ts          # test data loader and text/regex helpers
│   │   └── shop.ts          # product, search, cart, checkout and address helpers and locators
│   ├── test-data/
│   │   └── test_data.json   # all test data and expected values
│   ├── registration/  login/  header/  products/
│   ├── cart/  checkout/  order/  access/
│   └── seed.spec.ts         # starting point used by the generator agent
├── .mcp.json                # Playwright Test MCP server config for Claude Code
├── playwright.config.ts
├── CLAUDE.md                # project guidance for Claude Code
└── package.json
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer (LTS recommended)
- npm

### Install

```bash
git clone https://github.com/imranquaderi/Playwright-Automation-Framework-with-Claude-Code.git
cd Playwright-Automation-Framework-with-Claude-Code
npm ci
npx playwright install --with-deps
```

### Run tests

```bash
npx playwright test                              # all tests, all 3 browsers
npx playwright test --project=chromium           # a single browser
npx playwright test tests/cart                   # one folder
npx playwright test tests/cart/add.spec.ts       # one file
npx playwright test -g "adds a product"          # tests whose title matches
npx playwright test --headed                     # watch the browser
npx playwright test --ui                         # interactive UI mode
```

### Reports

```bash
npx playwright show-report                       # open the HTML report from the last run
```

On CI, Playwright records a trace the first time it retries a failed test. Open the trace from the HTML report.

---

## Writing tests

Tests follow a few conventions. Here is an example:

```ts
import { test, expect } from '@playwright/test';
import { newLoggedInUser, addToCart, cartRows, itemQty, PRODUCTS } from '../helpers/shop';
import { testData } from '../helpers/data';

const data = testData.suites.cart.add;

test.describe('Cart', () => {
  test('CART-02 logged-in user adds a product', async ({ page }) => {
    await newLoggedInUser(page);              // registers and logs in a brand-new user
    await addToCart(page, PRODUCTS.sofa);

    await expect(cartRows(page)).toHaveCount(data.expectedRowCount);
    await expect(itemQty(page, PRODUCTS.sofa)).toHaveText(String(data.expectedQty));
  });
});
```

**Conventions**

1. **Use relative URLs.** Write `page.goto('/login')` so the `baseURL` from `playwright.config.ts` is applied.
2. **Never use fixed seeded accounts.** Create a new user with `uniqueUsername()` and `registerUser()`, or `newLoggedInUser()`.
3. **Pick locators in this order:** element IDs for form inputs (`#username`, `#password`, `#confirmPassword`), then role or text locators with case-insensitive regexes for buttons, links and toasts.
4. **Keep data in JSON.** Add expected values to `test_data.json` rather than writing them in the spec.
5. **Test one behavior per test** and don't use `waitForTimeout`.
6. **Check login state in `localStorage`.** It holds `username`, `token` and `balance`; read them with `page.evaluate`.

---

## AI-assisted workflow with Claude Code

This framework comes with Claude Code agents and the Playwright Test MCP server (configured in `.mcp.json`), which let the agents drive a real browser:

| Agent | Purpose |
| --- | --- |
| `playwright-test-planner` | Explores the live app and writes a Markdown test plan into `specs/` |
| `playwright-test-generator` | Turns a test plan scenario into a working `.spec.ts`, using locators taken from the live page |
| `playwright-test-healer` | Runs failing tests, debugs them and fixes broken locators or assertions |
| `test-improver` | Reviews specs for locator quality, fixed waits, web-first assertions and test independence |

Typical loop: **plan → generate → run → fix → review**.

---

## Continuous integration

`.github/workflows/playwright.yml` runs on every push and pull request to `main` or `master`. It:

1. installs dependencies and Playwright browsers
2. runs the full suite (CI settings: 1 worker, 2 retries, and the run fails if any `test.only` is left in)
3. uploads `playwright-report/` as a build artifact, kept for 30 days

---

## Author

**Imran Quaderi** · [@imranquaderi](https://github.com/imranquaderi)
