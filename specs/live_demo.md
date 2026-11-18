# QKart Registration - Live Demo (Positive Only)

## Application Overview

Small, demo-friendly positive plan for user registration at /register. Data sets (fresh unique username each run): (A) password abc123, (B) password Test@1234. Inputs: #username, #password, #confirmPassword; button "Register Now". Enter does not submit. Registration does not auto-login. Helpers: tests/helpers/auth.ts (uniqueUsername, registerUser, login).

## Test Scenarios

### 1. Registration (live demo)

**Seed:** `tests/login.spec.ts`

#### 1.1. Successful registration (data-driven, 2 data sets)

**File:** `tests/registration/live-demo-register-success.spec.ts`

**Steps:**
  1. For each data set (abc123; Test@1234): go to /register, fill #username with a fresh unique username, fill #password and #confirmPassword with the data set password, click 'Register Now'.
    - expect: Toast 'Registered Successfully' appears
    - expect: Browser redirects to /login

#### 1.2. Newly registered user can log in

**File:** `tests/registration/live-demo-register-then-login.spec.ts`

**Steps:**
  1. Register a fresh user (password abc123, then repeat with Test@1234 as 2 data sets) via /register and wait for /login.
    - expect: Redirected to /login
  2. Fill #username and #password, click 'Login to QKart'.
    - expect: Toast 'Logged in successfully'
    - expect: URL path is /
    - expect: localStorage has username equal to the registered username and a non-empty token

#### 1.3. Login here link navigates to login page

**File:** `tests/registration/live-demo-login-link.spec.ts`

**Steps:**
  1. Go to /register and click the 'Login here' link.
    - expect: URL becomes /login
    - expect: Login heading and 'Login to QKart' button are visible
