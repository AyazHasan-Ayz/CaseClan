# CASECLAN Supabase commerce database

The linked project has these applied migrations:

- `20260929000100_caseclan_commerce.sql`: commerce tables, indexes, RLS policies, and storage buckets.
- `20260929000200_seed_caseclan_catalog.sql`: non-destructive bootstrap of the existing products, phone models, and compatibility mappings.

Run `npm run verify:supabase` to verify live public catalog reads and private-data protection through the publishable key. The browser storefront reads the remote catalog first and uses the bundled catalog only as a resilience fallback.

Public catalog reads use the publishable browser client. Product, order, coupon, settings, fulfillment, and production-file writes must use the server-only admin client.
