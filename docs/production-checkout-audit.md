# Production checkout audit — 9 October 2026

Production: https://caseclan.vercel.app

## Delivery status

Code fixes are deployed through commits `96bc754`, `fdfa227`, and `dbf6047`. TypeScript passed, all 58 automated tests passed, and the production build generated 109 routes successfully. Live desktop/mobile price, gallery, checkout total, cancellation, retry initialization, and COD flows were exercised. Successful Razorpay capture, actual callback signature verification, and a signed successful-payment webhook remain unverified because test checkout rejected the test cards.

## Root causes and fixes

1. **Checkout delay:** the script loaded during payment initiation, requests ran unnecessarily in sequence, and redundant authentication/asset requests added latency. The script now has one reusable preload promise, timeout/retry handling, parallel preparation, a busy guard, and a preparing-payment state. Server verification remains mandatory. Observed timings: script preload 537 ms, prepare request 560 ms, payment session 1,900 ms, and Checkout.open invocation 35 ms. The last number measures invocation, not the time until Razorpay is visibly painted; a full visible-latency measurement is still outstanding.
2. **Prices:** one catalog pricing utility chooses the selling price. A shared display component shows compare-at pricing only when it exceeds the selling price. The server quote supplies payable totals; client-supplied prices are ignored.
3. **Hidden ₹99:** no storefront settings row existed. The frontend defaulted to free shipping while the backend defaulted to ₹99. Both now default to zero unless a shipping charge is explicitly configured. This was an inconsistent fallback, not evidence of an intentional shipping policy. Explicit ₹99 shipping and the free-shipping threshold remain supported and are displayed before payment.
4. **Premature orders:** local checkout finalized and cleared the bag before successful payment, normal lists included pending attempts, and a pending verification response could be treated as success. Internal attempts now remain pending, paid orders require server confirmation, and normal customer/admin lists show confirmed prepaid or legitimate COD orders. Cancelled/failed payments preserve the cart and offer retry.
5. **Gallery:** the catalog fetched secondary images but the product page rendered only the primary image. The gallery now uses primary plus ordered, deduplicated Supabase images, desktop thumbnails, mobile scroll snapping, proportional images, lazy secondary loading, and a broken-image fallback.
6. **Additional live regressions:** confirmed COD lacked the payment-method field in the local confirmation guard; this is fixed. Reloading checkout with a remote-only catalog product could access an undefined product while the catalog restored; checkout now handles that loading state safely.
7. **Final visual correction:** the existing `.detail-price span` tax-note rule also matched the new price wrapper. It now targets only the direct tax-note span, preserving the prominent selling price and spaced compare-at price.

## Server lifecycle and deployment

Applied additive migration: `supabase/migrations/20261007063124_authoritative_checkout_and_payment_settlement.sql`.

Authenticated `checkout_quote` fetches current catalog prices, models, coupons, and shipping settings. `place_order` stores that quote and uses a stable checkout key with transaction locking to prevent repeated initialization from producing duplicate orders. Client prices cannot override the quote. Service-only payment preparation reuses provider order IDs. Settlement atomically confirms captured payments and records deduplicated webhook events; later failed/cancelled deliveries cannot downgrade a paid order. COD is confirmed separately with `cod_pending` and does not open Razorpay.

The deployed Edge Functions are `razorpay-checkout`, `razorpay-verify`, `razorpay-status`, and `razorpay-webhook`. Browser components receive no secret keys. Anonymous payment calls and unsigned webhook requests were rejected. Existing historical records were retained, with incomplete attempts filtered from normal order lists. No reset or destructive cleanup was performed.

## Validation evidence

- Live product: Mercedes Collage Clear Case, selling ₹599, compare-at ₹999, one primary plus five additional persistent Supabase gallery images. Desktop thumbnail switching and mobile 390 px gallery scrolling/selection worked; images loaded without stretching or horizontal document overflow.
- Live checkout showed subtotal ₹599, complimentary shipping, total ₹599; Razorpay Test Mode also displayed ₹599.
- Closing Razorpay retained the cart, displayed the saved-cart retry message, and did not add the unpaid attempt to normal My Orders/Admin Orders.
- Retrying the initial test reused internal order 13 and provider order `order_TlJJFp2Vfa2Dua`, instead of creating a second attempt.
- Live COD order 15 reached the order-success page and cleared the cart. COD test orders 14 and 15 were subsequently cancelled through Admin with a QA/do-not-fulfil note. The owner's profile name was restored. Rows were retained for audit.
- Transaction tests, rolled back after execution, verified ₹1 client price tampering is ignored, zero/₹99 shipping totals, idempotent order/provider reuse, failed-to-paid settlement, duplicate-event handling, no late downgrade, and confirmed COD. These database tests do not constitute real Razorpay payment/signature/webhook proof.
- Latest rejected mobile card test left the cart intact, exposed TRY PAYMENT AGAIN after exiting, and produced no captured-payment confirmation. No app console errors were captured in that test tab.
- A fresh remote SQL read confirmed the latest attempt is internal order 16, total ₹599, provider order `order_Tlqc1Bh5L9dMmu`, order state Payment Pending, payment state cancelled, no provider payment ID, and `signature_verified=false`. It was not converted into a paid/confirmed order.
- Reloaded customer and admin order lists showed only the two cancelled COD QA orders (14 and 15); unpaid prepaid attempts 13 and 16 were absent from both lists.

## Razorpay test blocker

The checkout offered UPI QR, without a UPI collect field for `success@razorpay`. HDFC test netbanking remained at Processing without a usable success simulator. The Visa test returned: **“Card can currently not be used with issuer for tokenization.”**

The user's subsequent Mastercard test returned exactly: **“Payment could not be completed. Your payment didn't go through due to invalid card details. Try another payment method or contact your bank for details.”**

These are Razorpay Checkout errors. Their underlying account/payment-method configuration cause has not been established. Do not enable live payments or represent successful capture/webhook verification as complete. Automatic approval review required the user to perform the final test-card submission; no attempt was made to bypass that handoff.

## Remaining setup/checks

Existing test credentials successfully create Razorpay orders. No additional secret was introduced by this patch. Check the Razorpay Test Mode account/payment-method configuration or provide these exact errors to Razorpay support. Confirm the dashboard webhook URL is `https://ftjucooznvhpdcjsfngr.supabase.co/functions/v1/razorpay-webhook`, subscribed to `order.paid`, `payment.captured`, `payment.failed`, and `refund.processed`, with a secret matching `RAZORPAY_WEBHOOK_SECRET`. The actual dashboard subscription and successful signed delivery still need proof.

After a successful test payment, verify provider capture, `payments.signature_verified`, `payment_status=paid`, confirmed order state, one order, cart clearing, success routing, customer/admin visibility, and the corresponding private webhook event. A retry that eventually succeeds is also still pending.

## How to test one ₹599 order

1. Open `/product/?id=mercedes-collage-clear-case&device=iphone-17`, select the model, and add one case to an otherwise empty bag.
2. Sign in and proceed to checkout. Confirm subtotal ₹599, shipping Complimentary, and total ₹599 before choosing Online Payment.
3. Open Razorpay and confirm its Test Mode label and ₹599 amount. Use the test methods documented at https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/ ; avoid saving the test card. Do not use real payment credentials.
4. If Razorpay rejects the test, preserve the exact error. Exit and confirm the cart remains and retry is available. Do not expect an order-success page.
5. Once the provider test succeeds, check the success page and empty bag; then verify the remote paid/signature/webhook evidence listed above. A browser callback alone is insufficient.

## Modified files

Components: `Account.tsx`, `ProductCard.tsx`, `ProductDetail.tsx`, new `ProductGallery.tsx`, new `ProductPrice.tsx`, `Shell.tsx`, `StoreProvider.tsx`, `UtilityPages.tsx`.

Libraries: `admin.ts`, `payment-state.ts`, new `pricing.ts`, `razorpay.ts`, `supabase/account.ts`, `supabase/admin-orders.ts`, `supabase/catalog-runtime.ts`, `supabase/types.ts`.

Also: `app/globals.css`, `.gitignore`, `package.json`, the four Razorpay Edge Functions, the migration above, and new `tests/checkout-regressions.test.ts`.
