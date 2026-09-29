# CASECLAN Supabase preparation

`migrations/202609290001_caseclan_commerce.sql` is intentionally **not applied** yet. It prepares the commerce tables, indexes, RLS policies, and storage buckets requested for the Supabase-backed phase while leaving the current in-code CASECLAN catalog untouched.

Before applying it:

1. Add a valid `SUPABASE_SECRET_KEY` to `.env.local` and the deployment environment.
2. Run `npm run check:supabase` and confirm both public and admin checks pass.
3. Review the migration against the selected Supabase project.
4. Apply it through the Supabase CLI or SQL editor, then generate database types from the deployed schema.

Public catalog reads use the publishable browser client. Product, order, coupon, settings, fulfillment, and production-file writes must use the server-only admin client.
