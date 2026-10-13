# Admin orders, coupons and header — production audit

Date: 2026-10-13. Production: https://caseclan.in.

## Changes

- Existing Supabase orders remain the only order store. `update_order_fulfilment` locks the order, validates the current database staff role and allowed statuses, and updates only supplied fulfilment fields. It cannot change payment status.
- A database trigger records `status_updated_at` and appends server timestamps to status history. Existing tracking fields survive status-only saves.
- Admin orders display customer contact details, product/model/quantity, payment information, coupon and price breakdown. Requested statuses, including Printed and RTO, coexist with legacy statuses.
- Customer account and tracking pages read the same saved status/history. Account data refreshes when the page becomes visible again.
- Coupon create/edit and activation controls persist through the existing authenticated `admin-catalog` Edge Function. Validation covers percentage/fixed discounts, minimum amount, maximum discount, dates, global usage and per-user limits.
- Checkout trims and compares coupon codes case-insensitively, calculates prices on the server, clamps fixed discounts to subtotal, and preserves the entered coupon across refresh. Existing payment functions use that verified order total.
- Removed the announcement strip and its CSS. Product/checkout delivery information remains.

## Database and deployment

Applied additive migration:
`supabase/migrations/20261013084327_admin_order_status_and_coupon_controls.sql`

It adds the order status timestamp/trigger/RPC, a normalized coupon-code index, and strengthens the existing checkout quote. Existing data was not reset or deleted. RLS, authentication, ownership checks and the production origin allowlist remain enforced.

Redeployed `admin-catalog` through the authenticated Supabase dashboard, with source equivalent to the repository function plus its shared modules. The local CLI had no saved access token.

Frontend release: commit `db37115`, Netlify production deploy `6acdf70e54cf969b8ca4ae8f`.

## Verification

- Production build passed; 75 automated tests passed.
- Real remote database tests passed for staff status updates, invalid status rejection, customer denial, timestamps and preserved payment/tracking fields.
- Remote coupon tests passed: percentage, fixed discount clamping, cap, invalid, expired, inactive, minimum, start date, global limit and per-user limit.
- Real `place_order` and payment initialization records matched server quotes for online and COD payment. Those isolated database test writes were rolled back.
- Live admin status save persisted after reload and appeared in My Orders and Track Order. The existing QA order was restored to Cancelled.
- Live admin coupon creation/editing persisted after reload. Checkout showed 10% off 599 = 539.10, then fixed 75 off 599 = 524. Invalid code rejected. Coupon survived checkout refresh.
- Live Razorpay Test Mode modal and production payment initialization used 524 / 52400 paise for the coupon order.
- A separate user-completed Razorpay payment was captured, signature-verified and confirmed, but it was a 1-rupee order without a coupon. The coupon payment attempts were cancelled, so they do not count as successful coupon payment tests.
- Announcement strip absent at mobile, tablet and desktop widths. Header top is zero, no horizontal overflow, and sticky positioning survives scrolling. No homepage console errors observed.

## Remaining live test handoff

The prepared discounted COD checkout and a captured Razorpay payment with a coupon still require final user submission and verification. Do not mark these tests passed from payment initialization alone.

Temporary QA coupon is limited and expires; deactivate it after those tests. Keep test orders flagged not to fulfil and preserve all payment records.
