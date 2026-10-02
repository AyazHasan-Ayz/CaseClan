# Qikink sandbox Store SKU diagnostic

Hello Qikink Support,

We are integrating CASECLAN with the Qikink Sandbox API. Authentication succeeds and
returns an access token, but `POST /api/order/create` rejects all three Store SKUs copied
directly from **My Products -> View Variations**.

- iPhone 17: HTTP 400, `Invalid SKU`
- iPhone 17 Pro: HTTP 400, `Invalid SKU`
- iPhone 17 Pro Max: HTTP 400, `Invalid SKU`

Each request uses `search_from_my_products: 1` and excludes design details, as required
for a My Products Store SKU. The response body is identical for every variation:

```json
{"error":"Invalid SKU","status_code":"400"}
```

Please confirm whether our sandbox API credentials are connected to a different
account/catalog than the dashboard showing these products. If so, please provide the
corresponding sandbox Store SKUs or mirror these three phone-case products into the
sandbox catalog associated with our API credentials.

We can provide the sandbox client/account identifier and the exact Store SKUs privately
in the support ticket.
