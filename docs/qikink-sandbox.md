# Qikink sandbox integration

CASECLAN's Qikink adapter is intentionally locked to `https://sandbox.qikink.com`.
The client lives in `lib/qikink/client.ts`, imports `server-only`, requests short-lived
tokens, and never exposes the client secret through a `NEXT_PUBLIC_` variable.

## Environment

Configure these only in a server runtime:

- `QIKINK_ENVIRONMENT=sandbox`
- `QIKINK_AUTOMATIC_FULFILMENT=false`
- `QIKINK_SANDBOX_BASE_URL=https://sandbox.qikink.com`
- `QIKINK_SANDBOX_CLIENT_ID`
- `QIKINK_SANDBOX_CLIENT_SECRET`
- `QIKINK_SANDBOX_PHONE_SKU_IPHONE_17` (the **Store SKU** from Qikink My Products)
- `QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO`
- `QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO_MAX`

The variables are configured locally in the ignored `.env.local` file and as Vercel
Production secrets. CASECLAN catalog SKUs such as `CC-MINIMAL-NAME` are not
Qikink fulfillment SKUs and must never be sent to the API.

Automatic order submission is currently disabled. CASECLAN saves orders and private
production files to Supabase; staff create the Qikink order manually and save the
provider order ID, courier, AWB, tracking URL, fulfilment status, and shipment status
from the admin order page. The sandbox adapter remains server-only for future use.

## Verified on 2026-10-01

- `POST /api/token`: HTTP 200; token issued.
- Public artwork and preview URLs on `caseclan.vercel.app`: HTTP 200, `image/png`.
- `POST /api/order/create`: endpoint and validation contract reached. Qikink rejected
  the public hard-clear-case identifiers with HTTP 400, `Invalid Print Type ID for This SKU`.
- `GET /api/order?id=0`: HTTP 200 with an empty result, confirming authenticated access
  to the status endpoint. No sandbox order was created, so status for a real order,
  tracking, and AWB cannot be truthfully marked as passed yet.
- The supplied iPhone 17 Store SKU was tested against the authenticated sandbox. Store
  mode correctly rejected per-order `designs` with `Design details are not needed.`;
  after removing those fields it returned `Invalid SKU`. Direct-artwork mode returned
  `Invalid Print Type ID for This SKU`. This proves the Store SKU is not present in the
  My Products catalog visible to these sandbox credentials.
- A clean Store SKU mode diagnostic was rerun for all three unchanged mappings. The
  iPhone 17, iPhone 17 Pro, and iPhone 17 Pro Max requests each returned HTTP 400 with
  `{ "error": "Invalid SKU", "status_code": "400" }`. Authentication succeeded before
  the three calls. This confirms a mismatch between the catalog visible to the sandbox
  API credentials and the dashboard catalog where the variations are shown. The API
  response does not expose an account/catalog identifier, so Qikink must confirm whether
  the credentials point to another sandbox catalog or mirror the products into it.

Qikink's official public catalog identifies the product as Hard Clear Case `CC32`, and
the public product metadata exposes catalog SKU `ClrCs`, iPhone 17 type ID `128`, and
Accessories print type ID `5`. The order API still requires the account-specific Store
SKU shown under Qikink Dashboard -> My Products -> View Variations. Published catalog
identifiers are not accepted as that Store SKU.

## Safety behavior

- Payload creation rejects missing provider SKUs and non-public artwork URLs.
- COD maps to `COD`; card, UPI, and prepaid map to `Prepaid`.
- Order references are normalized to Qikink's 15-character alphanumeric limit.
- Order submission requires an idempotency store. A second successful submission with
  the same CASECLAN order reference returns the stored response instead of calling Qikink.
- Failed submissions release their claim so an operator can fix the mapping and retry.

Before live access, mirror the mapped phone-case variations into the Qikink sandbox
account associated with these API credentials (or issue Store SKUs from that sandbox),
then run a successful order, fetch its status, and verify courier, tracking URL, and AWB.
