# QKart E-commerce QA Site Test Plan

## Application Overview

Test plan for QKart (https://crio-qkart-frontend-qa.vercel.app, baseURL). Observed facts: product grid has 12 items on page 1 and 9 on page 2 (MUI pagination, 'Go to page 2'). Header: guest = Login/Register buttons; logged-in = avatar img (alt=username), username text, Logout button. Inputs: #username, #password, #confirmPassword; buttons 'Login to QKart', 'Register now', 'Add new address', 'Add', 'Cancel', 'Delete', 'PLACE ORDER', 'Continue Shopping'; cart +/- and product add-to-cart buttons are icon-only (use getByRole('button',{name:'Add to cart'}) which works for product cards; cart +/- have no accessible name). Toasts are notistack (#notistack-snackbar / role alert) and are auto-dismissed. localStorage keys: username, token, balance (new users start at 5000). GLOBAL RULES: every scenario starts from a blank browser context and registers its OWN user via uniqueUsername()+registerUser() from tests/helpers/auth.ts (PASSWORD = Test@12345) and, where needed, login(); never use seeded accounts. Seed file tests/seed.spec.ts. Cart and addresses are stored server-side per user, so they persist across reloads and logout/login. Scenarios marked [AUTOMATED] are already covered by tests/login.spec.ts or tests/login-happy-flow.spec.ts. Assert toast text with case-insensitive regex. Product reference prices: Stylecon 9 Seater RHS Sofa Set $650, Thinking Fast and Slow $15, YONEX Smash Badminton Racquet $100, Roadster Mens Running Shoes $30 (size combobox 6-10), Nike Mens Running Shoes $80, Jenga $120, Kindle $30; page 2: Pen Drive $55, HandBag $35, Saree $100, SuitCase $120, Solar Plane $40, Sticker $50, Router $60, Wood Stand $80, Wallet $40.

## Test Scenarios

### 1. Registration

**Seed:** `tests/seed.spec.ts`

#### 1.1. REG-01 (P0) Register with valid details

**File:** `tests/registration/register-valid.spec.ts`

**Steps:**
  1. Precondition: blank state. Go to /register. Verify heading 'Register', #username, #password, #confirmPassword, 'Register now' button, 'Already have an account? Login here' link (href /login), hint text 'Password must be atleast 6 characters length', 'Back to explore' button.
    - expect: All elements visible
  2. Fill unique username (uniqueUsername()), password Test@12345, same confirm; click 'Register now'.
    - expect: Toast 'Registered Successfully' appears
    - expect: URL becomes /login
    - expect: localStorage has no token (user is NOT auto-logged in)

#### 1.2. REG-02 (P1) Empty form shows username required

**File:** `tests/registration/register-empty.spec.ts`

**Steps:**
  1. Go to /register, click 'Register now' with all fields empty.
    - expect: Toast 'Username is a required field'
    - expect: URL stays /register

#### 1.3. REG-03 (P1) Password required

**File:** `tests/registration/register-no-password.spec.ts`

**Steps:**
  1. Fill only a unique username, click 'Register now'.
    - expect: Toast 'Password is a required field'
    - expect: Stays on /register

#### 1.4. REG-04 (P1) Username shorter than 6 characters

**File:** `tests/registration/register-short-username.spec.ts`

**Steps:**
  1. Fill username 'abc', password and confirm Test@12345; submit.
    - expect: Toast 'Username must be at least 6 characters'
    - expect: Stays on /register

#### 1.5. REG-05 (P1) Password shorter than 6 characters

**File:** `tests/registration/register-short-password.spec.ts`

**Steps:**
  1. Fill unique valid username, password '12345', confirm '12345'; submit.
    - expect: Toast 'Password must be at least 6 characters' (note: inline hint spells 'atleast')
    - expect: Stays on /register

#### 1.6. REG-06 (P1) Confirm password mismatch

**File:** `tests/registration/register-mismatch.spec.ts`

**Steps:**
  1. Fill unique username, password Test@12345, confirm Other@12345; submit.
    - expect: Toast 'Passwords do not match'
    - expect: Stays on /register; no account created (verify by trying to log in afterwards -> 'Username does not exist')

#### 1.7. REG-07 (P0) Duplicate username rejected

**File:** `tests/registration/register-duplicate.spec.ts`

**Steps:**
  1. registerUser(page, u, PASSWORD). Then go to /register again and register the same u.
    - expect: Toast 'Username already exists'
    - expect: Stays on /register

#### 1.8. REG-08 (P2) Boundary: username and password exactly 6 characters

**File:** `tests/registration/register-boundary.spec.ts`

**Steps:**
  1. Register with a unique 6-char username (e.g. random lowercase letters) and 6-char password.
    - expect: Registered Successfully, redirect to /login (6 is accepted)

#### 1.9. REG-09 (P2) Navigation links on register page

**File:** `tests/registration/register-nav.spec.ts`

**Steps:**
  1. Click 'Login here' link; go back; click 'Back to explore'.
    - expect: 'Login here' -> /login
    - expect: 'Back to explore' -> / (product listing)

#### 1.10. REG-10 (P2) Password fields are masked and username with special characters / whitespace

**File:** `tests/registration/register-misc.spec.ts`

**Steps:**
  1. Verify #password and #confirmPassword have type=password. Attempt registration with a username containing leading/trailing spaces and symbols (exploratory).
    - expect: Inputs masked
    - expect: Record actual behaviour (not probed live); no unhandled error or blank screen

### 2. Login

**Seed:** `tests/seed.spec.ts`

#### 2.1. LOGIN-01 (P1) [AUTOMATED: login.spec.ts 'displays the login form'] Login form renders

**File:** `tests/login.spec.ts`

**Steps:**
  1. Go to /login.
    - expect: Heading 'Login', #username, #password (type=password), 'Login to QKart' button enabled, 'Register now' link, 'Back to explore' button

#### 2.2. LOGIN-02 (P0) [AUTOMATED: login.spec.ts 'logs in successfully' and login-happy-flow.spec.ts] Login with valid credentials

**File:** `tests/login-happy-flow.spec.ts`

**Steps:**
  1. registerUser, then login(page,u,PASSWORD).
    - expect: Toast 'Logged in successfully'
    - expect: URL /
    - expect: Header shows avatar img alt=username, username text, Logout; Login/Register buttons gone
    - expect: localStorage username=u, token truthy (JWT), balance='5000'

#### 2.3. LOGIN-03 (P0) [AUTOMATED: login.spec.ts] Wrong password

**File:** `tests/login.spec.ts`

**Steps:**
  1. Register user; log in with WrongPass@1.
    - expect: Toast 'Password is incorrect'
    - expect: Stays /login; localStorage token absent

#### 2.4. LOGIN-04 (P1) [AUTOMATED: login.spec.ts] Non-existent username

**File:** `tests/login.spec.ts`

**Steps:**
  1. Log in with a never-registered unique username.
    - expect: Toast 'Username does not exist'
    - expect: Stays /login

#### 2.5. LOGIN-05 (P1) [AUTOMATED: login.spec.ts] Username required

**File:** `tests/login.spec.ts`

**Steps:**
  1. Submit with empty username, filled password.
    - expect: Toast 'Username is a required field'

#### 2.6. LOGIN-06 (P1) [AUTOMATED: login.spec.ts] Password required

**File:** `tests/login.spec.ts`

**Steps:**
  1. Submit with username only.
    - expect: Toast 'Password is a required field'

#### 2.7. LOGIN-07 (P2) [AUTOMATED: login.spec.ts] Register now link

**File:** `tests/login.spec.ts`

**Steps:**
  1. Click 'Register now'.
    - expect: URL /register

#### 2.8. LOGIN-08 (P1) Both fields empty

**File:** `tests/login/login-empty.spec.ts`

**Steps:**
  1. Go to /login, click 'Login to QKart' with nothing filled.
    - expect: Toast 'Username is a required field' (username checked first)

#### 2.9. LOGIN-09 (P2) Username case sensitivity and whitespace

**File:** `tests/login/login-case.spec.ts`

**Steps:**
  1. Register user; log in with username upper-cased and with trailing space.
    - expect: Record behaviour (not probed); expected rejection with 'Username does not exist' or consistent handling

#### 2.10. LOGIN-10 (P1) Session persists across reload and new tab

**File:** `tests/login/login-persist.spec.ts`

**Steps:**
  1. Register/login; reload /; open / in a new page of the same context.
    - expect: Still logged in (username + Logout visible); localStorage unchanged

#### 2.11. LOGIN-11 (P2) Visiting /login or /register while logged in (surprising behaviour)

**File:** `tests/login/login-while-authed.spec.ts`

**Steps:**
  1. Login, then page.goto('/login') and page.goto('/register').
    - expect: Observed: pages render the forms (no redirect). Record as current behaviour; flag if product expects redirect to /

### 3. Logout & Header

**Seed:** `tests/seed.spec.ts`

#### 3.1. HDR-01 (P0) [AUTOMATED: login.spec.ts 'logs out and clears the session'] Logout clears session

**File:** `tests/login.spec.ts`

**Steps:**
  1. Login; click Logout.
    - expect: Header shows Login and Register buttons; localStorage empty (token null, username/balance removed); user stays on / (no toast observed)

#### 3.2. HDR-02 (P1) Guest header on landing page

**File:** `tests/header/guest-header.spec.ts`

**Steps:**
  1. Open / in a blank context.
    - expect: QKart logo link (href /), search textbox 'Search for items/categories', 'Login' and 'Register' buttons; no username/Logout

#### 3.3. HDR-03 (P1) Header Login/Register buttons navigate

**File:** `tests/header/guest-nav.spec.ts`

**Steps:**
  1. From /, click 'Login' -> /login. From /, click 'Register' -> /register.
    - expect: URLs /login and /register respectively

#### 3.4. HDR-04 (P1) Back to Explore on login and register pages

**File:** `tests/header/back-to-explore.spec.ts`

**Steps:**
  1. Go to /login, click 'Back to explore'; repeat on /register.
    - expect: Navigates to / each time

#### 3.5. HDR-05 (P1) Logged-in header shows username and avatar

**File:** `tests/header/authed-header.spec.ts`

**Steps:**
  1. Register + login.
    - expect: img with accessible name = username, paragraph text = username, Logout button; same header on /checkout and /thanks (no search bar there)

#### 3.6. HDR-06 (P2) Logo link returns to product listing

**File:** `tests/header/logo.spec.ts`

**Steps:**
  1. Login, go to /checkout, click QKart logo.
    - expect: URL /

#### 3.7. HDR-07 (P2) Logout from checkout, then protected pages blocked

**File:** `tests/header/logout-checkout.spec.ts`

**Steps:**
  1. Login, go to /checkout, click Logout, then goto /checkout.
    - expect: Redirected to /, toast 'You must be logged in to access checkout page'

#### 3.8. HDR-08 (P2) Footer links

**File:** `tests/header/footer.spec.ts`

**Steps:**
  1. Visit /privacy-policy, /aboutus, /terms-of-service via footer links.
    - expect: Each page loads with content (privacy ~22k chars, about ~1k, terms ~13k); 'Contact us' is plain text, not a link

### 4. Product Listing & Search

**Seed:** `tests/seed.spec.ts`

#### 4.1. PRD-01 (P0) Landing page lists products with price and rating

**File:** `tests/products/listing.spec.ts`

**Steps:**
  1. Open / as guest.
    - expect: Banner 'India' s FASTEST DELIVERY to your door step'; 12 product cards on page 1 each with image, name, $price, star-rating image and add-to-cart icon button; Roadster and Nike shoes show 'Size chart' and a Size combobox (6-10, default 6)

#### 4.2. PRD-02 (P1) Pagination

**File:** `tests/products/pagination.spec.ts`

**Steps:**
  1. Click 'Go to page 2' / 'Go to next page' / 'Go to previous page'.
    - expect: Page 2 shows 9 products (Pen Drive, HandBag, Saree, SuitCase, Solar Plane, Sticker, Router, Wood Stand, Wallet); Previous disabled on page 1; URL unchanged

#### 4.3. PRD-03 (P0) Search by product name

**File:** `tests/products/search.spec.ts`

**Steps:**
  1. Type 'shoes' into the search textbox.
    - expect: Only 'Roadster Mens Running Shoes' and 'Nike Mens Running Shoes' remain (debounced, ~1s)

#### 4.4. PRD-04 (P1) Search is case-insensitive

**File:** `tests/products/search-case.spec.ts`

**Steps:**
  1. Search 'SHOES', then 'shoes', then 'ShOeS'.
    - expect: Same 2 results each time

#### 4.5. PRD-05 (P0) Search with no results

**File:** `tests/products/search-none.spec.ts`

**Steps:**
  1. Search 'xyzzy'.
    - expect: Text 'No products found' shown; no product cards; pagination hidden

#### 4.6. PRD-06 (P1) Clearing search restores full list

**File:** `tests/products/search-clear.spec.ts`

**Steps:**
  1. Search 'shoes', clear the box.
    - expect: All 12 page-1 products back

#### 4.7. PRD-07 (P2) Search by category (known gap)

**File:** `tests/products/search-category.spec.ts`

**Steps:**
  1. Search 'Furniture' (placeholder says items/categories).
    - expect: Observed: 'No products found' even though a sofa exists. Mark test.fixme / log defect if categories are meant to be searchable

#### 4.8. PRD-08 (P2) Search finds products from page 2 and special characters

**File:** `tests/products/search-page2.spec.ts`

**Steps:**
  1. Search 'wallet'; then search '<script>' and '%'.
    - expect: 'Wallet' shown; special chars yield 'No products found' with no crash

#### 4.9. PRD-09 (P2) Unknown route

**File:** `tests/products/not-found.spec.ts`

**Steps:**
  1. Go to /nonexistent.
    - expect: Observed: blank page (no 404 UI). Record; assert no crash

### 5. Cart

**Seed:** `tests/seed.spec.ts`

#### 5.1. CART-01 (P0) Guest cannot add to cart

**File:** `tests/cart/guest-add.spec.ts`

**Steps:**
  1. As guest, click an add-to-cart button on /.
    - expect: Toast 'Login to add an item to the Cart'; no cart panel; stays on /

#### 5.2. CART-02 (P0) Logged-in user adds a product

**File:** `tests/cart/add.spec.ts`

**Steps:**
  1. Register+login; click add-to-cart on 'Stylecon 9 Seater RHS Sofa Set'.
    - expect: Cart sidebar shows name, qty 1, $650, 'Order total $650' and a checkout button; no toast beyond 'Logged in successfully'

#### 5.3. CART-03 (P0) Adding the same product twice is rejected

**File:** `tests/cart/add-duplicate.spec.ts`

**Steps:**
  1. Add Sofa, click its add-to-cart again.
    - expect: Toast 'Item already in cart. Use the cart sidebar to update quantity or remove item.'; qty stays 1; total $650

#### 5.4. CART-04 (P0) Increase quantity updates line and total

**File:** `tests/cart/increase.spec.ts`

**Steps:**
  1. Add Sofa; click cart '+' (second icon button in the row).
    - expect: Qty 2, unit price $650, Order total $1300

#### 5.5. CART-05 (P0) Decrease quantity

**File:** `tests/cart/decrease.spec.ts`

**Steps:**
  1. Add Sofa, '+' then '-'.
    - expect: Qty 1, total $650

#### 5.6. CART-06 (P0) Quantity reaching zero removes the item

**File:** `tests/cart/remove-by-zero.spec.ts`

**Steps:**
  1. Add Sofa; click '-' once at qty 1.
    - expect: Item removed; cart panel shows 'Cart is empty. Add more items to the cart to checkout.'; no Order total or checkout button

#### 5.7. CART-07 (P1) Multiple products total

**File:** `tests/cart/multi.spec.ts`

**Steps:**
  1. Add Sofa ($650), Thinking Fast and Slow ($15), Roadster shoes ($30).
    - expect: Three rows; Order total $695

#### 5.8. CART-08 (P1) Cart persists across reload and logout/login

**File:** `tests/cart/persist.spec.ts`

**Steps:**
  1. Add items, reload; then Logout, log in again.
    - expect: Cart contents and total unchanged (stored server-side); guest sees no cart after logout

#### 5.9. CART-09 (P1) Product with size option

**File:** `tests/cart/size.spec.ts`

**Steps:**
  1. On Roadster shoes pick Size 8 via the combobox, add to cart.
    - expect: Item added at $30. Observed: cart does not display selected size (record as gap); adding Nike shoes separately is a distinct line

#### 5.10. CART-10 (P2) Add products from page 2

**File:** `tests/cart/page2.spec.ts`

**Steps:**
  1. Go to page 2, add 'Pen Drive' ($55) while cart has a page-1 item.
    - expect: Cart has both; total is the sum

#### 5.11. CART-11 (P2) Cart with many units

**File:** `tests/cart/large-qty.spec.ts`

**Steps:**
  1. Click '+' 20+ times on a $15 item.
    - expect: Qty and total increment correctly with no upper-bound error (no max observed)

#### 5.12. CART-12 (P2) Rapid double-click on add and +

**File:** `tests/cart/rapid-click.spec.ts`

**Steps:**
  1. Double-click '+' quickly.
    - expect: Qty increases by exactly 2 and total matches the server after reload

### 6. Checkout & Addresses

**Seed:** `tests/seed.spec.ts`

#### 6.1. CHK-01 (P0) Checkout page layout for new user

**File:** `tests/checkout/layout.spec.ts`

**Steps:**
  1. Register+login, add Sofa, Thinking Fast and Slow, Roadster; click checkout button.
    - expect: URL /checkout; headings 'Shipping', 'Payment'; text 'No addresses found for this account.Please add one to proceed'; 'Add new address' button; Wallet 'Pay $ 695 of available $ 5000'; PLACE ORDER disabled; right panel lists items with 'Qty: 1', Order Details Products 3, Subtotal $695, Shipping Charges $0, Total $695

#### 6.2. CHK-02 (P0) Add a valid address

**File:** `tests/checkout/add-address.spec.ts`

**Steps:**
  1. Click 'Add new address'; textbox 'Enter your complete address' appears with Add/Cancel; type '12345 Test Street, Springfield, Testland 560001'; click 'Add'.
    - expect: Address listed with radio button (unselected) and DELETE button; form closes; 'Add new address' returns; PLACE ORDER becomes enabled

#### 6.3. CHK-03 (P1) Address validation: empty and short

**File:** `tests/checkout/address-validation.spec.ts`

**Steps:**
  1. Click Add with empty textbox; then with 'abc'; then with 19 characters.
    - expect: Each time toast 'Address should be greater than 20 characters'; no address added; form stays open

#### 6.4. CHK-04 (P2) Address length boundary (inconsistency)

**File:** `tests/checkout/address-boundary.spec.ts`

**Steps:**
  1. Add address of exactly 20 characters ('12345678901234567890').
    - expect: Observed: accepted, although message says 'greater than 20'. Assert current behaviour and flag

#### 6.5. CHK-05 (P1) Cancel add address

**File:** `tests/checkout/address-cancel.spec.ts`

**Steps:**
  1. Open form, type text, click 'Cancel'.
    - expect: Form closes, nothing added

#### 6.6. CHK-06 (P0) Select an address

**File:** `tests/checkout/select-address.spec.ts`

**Steps:**
  1. Add two addresses; check the first radio (input[name=address]), then the second.
    - expect: Only one radio checked at a time

#### 6.7. CHK-07 (P0) Delete an address

**File:** `tests/checkout/delete-address.spec.ts`

**Steps:**
  1. Add two addresses; click DELETE on the second; reload.
    - expect: Second address gone (UI update is asynchronous, wait for it); first remains after reload; delete the last one -> 'No addresses found' text returns and PLACE ORDER disabled again

#### 6.8. CHK-08 (P1) Addresses persist across reload and logout/login

**File:** `tests/checkout/address-persist.spec.ts`

**Steps:**
  1. Add address, reload, logout, login, return to /checkout.
    - expect: Address still listed (server-side)

#### 6.9. CHK-09 (P1) Place order without selecting an address

**File:** `tests/checkout/no-address-selected.spec.ts`

**Steps:**
  1. Add address but do not select a radio; click PLACE ORDER.
    - expect: Toast 'Please select one shipping address to proceed.'; stays /checkout; balance unchanged

#### 6.10. CHK-10 (P1) Wallet balance display

**File:** `tests/checkout/wallet.spec.ts`

**Steps:**
  1. View payment section for several cart totals.
    - expect: 'Pay $ <total> of available $ <balance>' matches Order total and localStorage balance

#### 6.11. CHK-11 (P2) Checkout with empty cart (surprising behaviour)

**File:** `tests/checkout/empty-cart.spec.ts`

**Steps:**
  1. Logged-in new user with empty cart opens /checkout directly; add address, select it, click PLACE ORDER.
    - expect: Page renders with 'Pay $ 0 of available $ 5000', 'Cart is empty. Add more items to the cart to checkout.' and PLACE ORDER enabled; clicking shows toast 'Cart is empty'; no redirect, balance unchanged

#### 6.12. CHK-12 (P2) Long address and special characters

**File:** `tests/checkout/address-long.spec.ts`

**Steps:**
  1. Add a 300-character address and one with unicode/HTML characters.
    - expect: Rendered as text without layout break or script execution

### 7. Order Placement & Confirmation

**Seed:** `tests/seed.spec.ts`

#### 7.1. ORD-01 (P0) Place order successfully

**File:** `tests/order/place-order.spec.ts`

**Steps:**
  1. New user; add Sofa, Thinking Fast and Slow, Roadster ($695); /checkout; add address; select it; click PLACE ORDER.
    - expect: Toast 'Order placed successfully!'; URL /thanks; localStorage balance becomes '4305'

#### 7.2. ORD-02 (P0) Thanks page content

**File:** `tests/order/thanks.spec.ts`

**Steps:**
  1. Complete ORD-01 flow.
    - expect: Text "Yay! It's ordered" with emoji, 'You will receive an invoice for your order shortly.', 'Your order will arrive in 7 business days.', 'Wallet Balance $4305 Available', 'Continue Shopping' button; header shows username + Logout

#### 7.3. ORD-03 (P0) Continue Shopping and cart cleared

**File:** `tests/order/continue.spec.ts`

**Steps:**
  1. On /thanks click 'Continue Shopping'.
    - expect: URL /; cart shows 'Cart is empty...'; header still logged in

#### 7.4. ORD-04 (P0) Insufficient wallet balance

**File:** `tests/order/insufficient.spec.ts`

**Steps:**
  1. New user (balance 5000); add Sofa, click '+' until qty 8 (total $5200); checkout; add + select address; PLACE ORDER.
    - expect: Payment text 'Pay $ 5200 of available $ 5000'; toast 'You do not have enough balance in your wallet for this purchase'; stays /checkout; balance still 5000; cart retained

#### 7.5. ORD-05 (P1) Balance boundary: total equals balance

**File:** `tests/order/exact-balance.spec.ts`

**Steps:**
  1. Build a cart totalling exactly $5000 (e.g. Sofa x7 = 4550 + Racquet x4 = 400 + Jenga? choose combination) and place order.
    - expect: Order succeeds and balance becomes 0 (not probed live; confirm)

#### 7.6. ORD-06 (P1) Second order uses reduced balance

**File:** `tests/order/second-order.spec.ts`

**Steps:**
  1. Place ORD-01 order, Continue Shopping, add Sofa x7 ($4550) and attempt checkout.
    - expect: 'Pay $ 4550 of available $ 4305'; insufficient-balance toast; balance unchanged at 4305

#### 7.7. ORD-07 (P1) Balance and order survive reload/re-login

**File:** `tests/order/balance-persist.spec.ts`

**Steps:**
  1. After ORD-01, logout and log in again.
    - expect: localStorage balance reflects 4305 (server value); cart empty

#### 7.8. ORD-08 (P2) Direct visit to /thanks

**File:** `tests/order/thanks-direct.spec.ts`

**Steps:**
  1. Guest goes to /thanks; logged-in user without order goes to /thanks.
    - expect: Guest redirected to / (no toast observed); logged-in user behaviour to be recorded (not probed)

#### 7.9. ORD-09 (P2) Double-click PLACE ORDER

**File:** `tests/order/double-submit.spec.ts`

**Steps:**
  1. Double-click PLACE ORDER with a valid cart.
    - expect: Only one deduction (balance 4305, not 3610)

### 8. Access Control (Guest vs Logged-in)

**Seed:** `tests/seed.spec.ts`

#### 8.1. ACL-01 (P0) Guest visiting /checkout directly

**File:** `tests/access/guest-checkout.spec.ts`

**Steps:**
  1. In blank context page.goto('/checkout').
    - expect: Redirected to /; toast 'You must be logged in to access checkout page'; product list shown

#### 8.2. ACL-02 (P1) Guest visiting /thanks directly

**File:** `tests/access/guest-thanks.spec.ts`

**Steps:**
  1. page.goto('/thanks') as guest.
    - expect: Redirected to / silently (no toast observed)

#### 8.3. ACL-03 (P1) Guest can browse and search but not add

**File:** `tests/access/guest-browse.spec.ts`

**Steps:**
  1. As guest search 'shoes', paginate, click add-to-cart.
    - expect: Browsing works; add shows 'Login to add an item to the Cart'

#### 8.4. ACL-04 (P1) Tampered or expired token

**File:** `tests/access/bad-token.spec.ts`

**Steps:**
  1. Login, set localStorage token to 'garbage', reload, go to /checkout and try to add to cart.
    - expect: Record behaviour (not probed): expect graceful error or redirect, no blank screen

#### 8.5. ACL-05 (P1) Logged-in user session isolation

**File:** `tests/access/isolation.spec.ts`

**Steps:**
  1. User A adds items and an address; log out; user B registers/logs in.
    - expect: B sees empty cart, no addresses, balance 5000

#### 8.6. ACL-06 (P2) Protected page after logout via back button

**File:** `tests/access/back-after-logout.spec.ts`

**Steps:**
  1. Login, go to /checkout, Logout, browser back.
    - expect: Checkout data not usable; redirect to / with login-required toast
