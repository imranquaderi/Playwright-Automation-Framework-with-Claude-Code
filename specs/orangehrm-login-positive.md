# OrangeHRM Login – Positive Test Plan

**App:** https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
**Seed:** `tests/seed.spec.ts`
**File:** `tests/orangehrm/login-positive.spec.ts`
**Credentials:** `Admin` / `admin123` (public demo credentials shown on the login page)

> The project `baseURL` points at QKart, so these tests use the absolute OrangeHRM URL.

## Suite: OrangeHRM Login - Positive

### 1. logs in with valid credentials using the Login button
1. Open the login page.
2. Enter username `Admin` and password `admin123`.
3. Click **Login**.

**Expect:** URL contains `/dashboard/index`; the "Dashboard" header is visible; the user profile dropdown in the top bar is visible.

### 2. logs in with valid credentials by pressing Enter
1. Open the login page.
2. Enter username `Admin` and password `admin123`.
3. Press **Enter** in the password field.

**Expect:** URL contains `/dashboard/index`; the "Dashboard" header is visible.

### 3. keeps the user logged in after a page reload
1. Log in with valid credentials.
2. Reload the page.

**Expect:** User stays on `/dashboard/index` and the "Dashboard" header is still visible (not redirected to login).

### 4. logs out successfully after a valid login
1. Log in with valid credentials.
2. Open the user profile dropdown and click **Logout**.

**Expect:** URL contains `/auth/login`; the **Login** button and the username field are visible.
