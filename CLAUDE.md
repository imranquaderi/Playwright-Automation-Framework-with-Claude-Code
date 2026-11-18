# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Playwright (TypeScript) end-to-end test suite for the QKart e-commerce frontend, hosted at `https://crio-qkart-frontend-qa.vercel.app` (set as `baseURL` in `playwright.config.ts`). There is no application code here — only tests against the deployed QA site. `package.json` defines no npm scripts; everything runs through `npx playwright`.

## Commands

```bash
npm ci                                   # install deps
npx playwright install --with-deps       # install browsers (first time / CI)
npx playwright test                      # run all tests on chromium, firefox, webkit
npx playwright test tests/login.spec.ts  # run one file
npx playwright test -g "logs in successfully"   # run tests matching a title
npx playwright test --project=chromium   # single browser
npx playwright test --headed             # watch the browser
npx playwright test --ui                 # interactive UI mode
npx playwright show-report               # open the HTML report (playwright-report/)
```

CI (`.github/workflows/playwright.yml`) runs `npx playwright test` on push/PR to `main`/`master` and uploads `playwright-report/`. With `CI` set, the config uses 1 worker, 2 retries, and fails on `test.only`; traces are captured on first retry.

## Test conventions

- Use relative paths with `page.goto('/login')` so `baseURL` applies.
- Tests run `fullyParallel` across three browsers against a shared live backend, so each test must be independent: create fresh accounts with a unique username (see `uniqueUsername()` + `registerUser()` in `tests/login.spec.ts`) rather than relying on fixed seeded users.
- Locator style used so far: element IDs for form inputs (`#username`, `#password`, `#confirmPassword`) and role/text locators with case-insensitive regexes for buttons, links, and toast messages.
- Logged-in session state lives in `localStorage` (`username`, `token`, `balance`); tests assert on it via `page.evaluate`.
- `tests/example.spec.ts` is the Playwright scaffold sample (hits playwright.dev), not a QKart test.
