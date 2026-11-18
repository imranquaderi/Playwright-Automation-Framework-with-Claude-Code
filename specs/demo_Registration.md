# demo_Registration

## Application Overview

Test plan for the QKart registration page (/register). Behavior below was confirmed by exploring the live QA site. Every scenario starts from a fresh browser state, is independent, and generates its own unique username (e.g. `demo${Date.now()}`, as in uniqueUsername()/registerUser() in tests/login.spec.ts). Inputs: #username, #password, #confirmPassword. Buttons, links and toasts use case-insensitive role/text regex locators. Valid password used in examples: `abcdef`.

## Test Scenarios

### 1. Registration - Happy Path

**Seed:** `tests/seed.spec.ts`

#### 1.1. Register with valid unique credentials

**File:** `tests/demo_registration/register-valid.spec.ts`

**Steps:**
  1. Go to /register. Fill #username with a unique username (>= 6 chars), #password with 'abcdef', #confirmPassword with 'abcdef'. Click 'Register Now'.
    - expect: Success toast 'Registered Successfully' is shown
    - expect: Page redirects to /login

### 2. Registration - Validation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Empty form shows username required

**File:** `tests/demo_registration/register-empty.spec.ts`

**Steps:**
  1. Go to /register, leave all fields empty, click 'Register Now'.
    - expect: Toast 'Username is a required field' is shown
    - expect: URL stays /register

#### 2.2. Username shorter than 6 characters is rejected

**File:** `tests/demo_registration/register-short-username.spec.ts`

**Steps:**
  1. Enter username 'abc' (also try 'ab'), password 'abcdef', confirm 'abcdef'. Click 'Register Now'.
    - expect: Toast 'Username must be at least 6 characters' is shown
    - expect: URL stays /register

#### 2.3. Empty password is rejected

**File:** `tests/demo_registration/register-no-password.spec.ts`

**Steps:**
  1. Enter a unique valid username, leave password and confirm empty. Click 'Register Now'.
    - expect: Toast 'Password is a required field' is shown
    - expect: URL stays /register

#### 2.4. Password shorter than 6 characters is rejected

**File:** `tests/demo_registration/register-short-password.spec.ts`

**Steps:**
  1. Enter a unique valid username, password '12345', confirm '12345'. Click 'Register Now'.
    - expect: Toast 'Password must be at least 6 characters' is shown
    - expect: URL stays /register

#### 2.5. Password and confirm password mismatch

**File:** `tests/demo_registration/register-mismatch.spec.ts`

**Steps:**
  1. Enter a unique valid username, password 'abcdef', confirm 'abcdeg'. Click 'Register Now'.
    - expect: Toast 'Passwords do not match' is shown
    - expect: URL stays /register

#### 2.6. Empty confirm password is treated as mismatch

**File:** `tests/demo_registration/register-empty-confirm.spec.ts`

**Steps:**
  1. Enter a unique valid username, password 'abcdef', leave confirm empty. Click 'Register Now'.
    - expect: Toast 'Passwords do not match' is shown
    - expect: URL stays /register

#### 2.7. Username of exactly 6 characters is accepted (boundary)

**File:** `tests/demo_registration/register-boundary.spec.ts`

**Steps:**
  1. Generate a unique 6-character username (e.g. 'a' + 5 random alphanumerics), password and confirm 'abcdef'. Click 'Register Now'.
    - expect: Toast 'Registered Successfully' is shown
    - expect: Redirect to /login

#### 2.8. Already-registered username is rejected

**File:** `tests/demo_registration/register-duplicate.spec.ts`

**Steps:**
  1. Register a unique user successfully (redirects to /login). Return to /register and submit the same username with a valid password and confirm.
    - expect: Toast 'Username already exists' is shown
    - expect: URL stays /register

### 3. Registration - UI and Navigation

**Seed:** `tests/seed.spec.ts`

#### 3.1. Register page elements are visible

**File:** `tests/demo_registration/register-ui.spec.ts`

**Steps:**
  1. Go to /register.
    - expect: Heading 'Register' visible
    - expect: #username (placeholder 'Enter Username'), #password (placeholder 'Enter a password with minimum 6 characters'), #confirmPassword (placeholder 'Re-enter your password to confirm') visible
    - expect: Helper text 'Password must be atleast 6 characters length' visible (note typo 'atleast' in the app)
    - expect: 'Register Now' button, 'Already have an account?' text, 'Login here' link and 'Back to explore' header button visible

#### 3.2. 'Login here' link navigates to login page

**File:** `tests/demo_registration/register-ui.spec.ts`

**Steps:**
  1. Go to /register and click the 'Login here' link.
    - expect: URL becomes /login

#### 3.3. 'Back to explore' button returns to products page

**File:** `tests/demo_registration/register-ui.spec.ts`

**Steps:**
  1. Go to /register and click the 'Back to explore' header button (text renders as 'BACK TO EXPLORE').
    - expect: URL becomes / (products listing)
