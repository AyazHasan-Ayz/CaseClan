# CASECLAN Razorpay setup

The storefront is a static Next.js export. Razorpay order creation and verification run in Supabase Edge Functions so key secrets never enter the browser bundle.

## Test-mode secrets

Set `RAZORPAY_MODE=test`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `CASECLAN_ALLOWED_ORIGINS=https://caseclan.vercel.app` as Supabase Edge Function secrets. The code also accepts explicit test/live key pairs. Live mode must remain disabled until the test-mode checks pass.

## Razorpay webhook

Configure this exact URL in the Razorpay Test Mode dashboard:

`https://ftjucooznvhpdcjsfngr.supabase.co/functions/v1/razorpay-webhook`

Subscribe to `order.paid`, `payment.captured`, `payment.failed`, and `refund.processed`. Use the same secret in the dashboard and `RAZORPAY_WEBHOOK_SECRET`. The function validates the raw request body with HMAC SHA-256 and deduplicates deliveries using `x-razorpay-event-id`.

## Server flow

The authenticated customer first creates an order with the existing `place_order` RPC, which calculates catalog prices in Supabase. `razorpay-checkout` reads that stored total and creates or reuses a Razorpay order. Standard Checkout receives only the public key ID. `razorpay-verify` signs the server-stored provider order ID and checks the Razorpay order ID, amount, currency, and captured state. Webhooks reconcile captured, failed, and refunded payments idempotently.

COD creates a separate `cod` payment record and never calls Razorpay. Automatic Qikink fulfilment remains disabled.
