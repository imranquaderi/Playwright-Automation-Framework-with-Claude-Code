# demo_today

## Application Overview

Positive registration flow for QKart QA (/register). One data-driven scenario run once per 2 data sets. Each run uses a fresh unique username (uniqueUsername() from tests/helpers/auth.ts). No boundary/format variations beyond the two sets. Pressing Enter does not submit; use the Register Now button.

## Test Scenarios

### 1. User Registration - Happy Path

**Seed:** `tests/login.spec.ts`

#### 1.1. Register a new user successfully (data-driven: 2 data sets)

**File:** `tests/registration/demo-today.spec.ts`

**Steps:**
  1. Data sets (loop, one test run each, fresh unique username each): (1) min-length password 'abc123'; (2) special-character password 'Test@1234'. Confirm password equals password. Start from fresh state.
    - expect: Two test runs are produced, one per data set
  2. Navigate to /register
    - expect: Register form is shown with #username, #password, #confirmPassword and a 'Register Now' button
  3. Fill #username with a fresh unique username, #password and #confirmPassword with the data set password
    - expect: Fields contain entered values
  4. Click 'Register Now' (do not press Enter)
    - expect: Toast 'Registered Successfully' appears
    - expect: Page redirects to /login
    - expect: localStorage has no username/token (user not auto-logged in)
  5. On /login fill #username and #password with the new credentials and click 'Login to QKart'
    - expect: Toast 'Logged in successfully' appears
    - expect: URL is / 
    - expect: localStorage username equals the registered username; token and balance are set
