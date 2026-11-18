# QKart Registration - Positive Flows

## Application Overview

Positive-path test plan for /register on QKart (baseURL https://crio-qkart-frontend-qa.vercel.app). Observed: heading "Register"; inputs #username, #password, #confirmPassword (all password fields type=password); helper text "Password must be atleast 6 characters length"; button "Register Now"; link "Login here" (/login); header button (Back to explore) and logo link to "/". Successful registration shows toast "Registered Successfully" and redirects to /login, then login with the new credentials shows home (/) with username in header, LOGOUT button, localStorage username/token/balance (balance 5000). Pressing Enter in a field does NOT submit the form (observed), so no Enter test is included as a positive flow. All scenarios use a fresh uniqueUsername() (tests/helpers/auth.ts) and start from a blank session. Existing helpers: uniqueUsername, registerUser, login in tests/helpers/auth.ts.

## Test Scenarios

### 1. Registration - positive flows

**Seed:** `tests/login.spec.ts`

#### 1.1. Register page displays the expected form

**File:** `tests/registration/register-form-display.spec.ts`

**Steps:**
  1. Navigate to /register
    - expect: Heading 'Register' visible
    - expect: #username, #password, #confirmPassword visible and empty
    - expect: #password and #confirmPassword have type=password
    - expect: Helper text 'Password must be atleast 6 characters length' visible
    - expect: 'Register Now' button enabled
    - expect: 'Login here' link visible

#### 1.2. Successful registration with valid data shows success toast and redirects to login

**File:** `tests/registration/register-success.spec.ts`

**Steps:**
  1. Go to /register; fill #username with uniqueUsername(), #password and #confirmPassword with 'abc123'; click 'Register Now'
    - expect: Toast 'Registered Successfully' visible (regex /registered successfully/i)
    - expect: URL ends with /login
    - expect: Login form (heading Login, #username, #password, 'Login to QKart' button) visible

#### 1.3. Newly registered user can log in

**File:** `tests/registration/register-then-login.spec.ts`

**Steps:**
  1. Register a fresh user via registerUser(page, username, PASSWORD)
    - expect: Redirected to /login
  2. Fill #username and #password with the same credentials and click login
    - expect: Toast 'Logged in successfully' visible
    - expect: URL is / (home)
    - expect: Username shown in header and LOGOUT button visible
    - expect: localStorage username equals registered username; token truthy; balance truthy (5000 observed)

#### 1.4. Registration does not log the user in automatically

**File:** `tests/registration/register-no-autologin.spec.ts`

**Steps:**
  1. Register a fresh user, remain on /login, read localStorage
    - expect: localStorage token is null
    - expect: Login page is shown, no LOGOUT button

#### 1.5. Password at minimum valid length (6 characters) registers successfully

**File:** `tests/registration/register-min-password.spec.ts`

**Steps:**
  1. Register fresh user with 6-char password (e.g. 'abc123'), then log in with it
    - expect: 'Registered Successfully' toast and redirect to /login
    - expect: Login with the 6-char password succeeds and lands on /

#### 1.6. Long username and long password register successfully

**File:** `tests/registration/register-long-values.spec.ts`

**Steps:**
  1. Register with a unique ~50-char username and 30-char password (matching confirm)
    - expect: 'Registered Successfully' toast and redirect to /login (observed to succeed)
    - expect: Login with those credentials succeeds

#### 1.7. Password containing spaces and special characters registers successfully

**File:** `tests/registration/register-special-password.spec.ts`

**Steps:**
  1. Register fresh user with password 'S p@#1' (same in confirm)
    - expect: 'Registered Successfully' toast and redirect to /login (observed to succeed)
    - expect: Login with that password succeeds

#### 1.8. Username with letters, digits and underscores registers successfully

**File:** `tests/registration/register-username-format.spec.ts`

**Steps:**
  1. Register with username like 'user_<timestamp>_<uuid8>' (the uniqueUsername format)
    - expect: Success toast and redirect to /login
    - expect: Login shows the exact username in the header

#### 1.9. 'Login here' link navigates to the login page

**File:** `tests/registration/register-login-link.spec.ts`

**Steps:**
  1. Go to /register and click 'Login here'
    - expect: URL ends with /login
    - expect: Login form visible

#### 1.10. Header back-to-explore button and logo navigate to home

**File:** `tests/registration/register-header-nav.spec.ts`

**Steps:**
  1. Go to /register and click the header button (Back to explore)
    - expect: URL is / and the product listing / header LOGIN and REGISTER buttons are visible for a logged-out user
  2. Go to /register again and click the QKart logo link (href '/')
    - expect: URL is / and home page is displayed

#### 1.11. Register link from login page leads to a working registration

**File:** `tests/registration/register-from-login.spec.ts`

**Steps:**
  1. Go to /login, click 'Register now'
    - expect: URL ends with /register and Register form visible
  2. Complete a registration with unique credentials
    - expect: 'Registered Successfully' toast and redirect to /login

#### 1.12. Register from home header REGISTER button then complete registration

**File:** `tests/registration/register-from-home.spec.ts`

**Steps:**
  1. Go to / as a logged-out user and click the header REGISTER button
    - expect: URL ends with /register
  2. Register with unique credentials
    - expect: Success toast, redirect to /login

#### 1.13. Multiple distinct users can be registered in the same browser session

**File:** `tests/registration/register-multiple-users.spec.ts`

**Steps:**
  1. Register user A, then register user B with different unique usernames
    - expect: Both registrations show the success toast and redirect to /login
    - expect: Each user can log in independently with own credentials (log out between)
