-- Server-only permissions used by admin-catalog after validating the caller's
-- Supabase user and current customers.role. No anon/authenticated grant changes.
-- RLS bypass does not itself grant table access; this project has no default
-- service_role table privileges for the commerce schema.
grant select on public.customers to service_role;
grant select, insert, update on public.products, public.product_images,
  public.phone_models, public.product_phone_models, public.coupons,
  public.store_settings to service_role;
grant delete on public.product_images to service_role;
grant select on public.reviews to service_role;
grant update (status, verified_purchase) on public.reviews to service_role;
