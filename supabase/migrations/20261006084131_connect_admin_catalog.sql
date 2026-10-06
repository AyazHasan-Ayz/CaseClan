-- Let authenticated staff read the complete catalog in Admin while public
-- visitors remain restricted to active products/models and approved reviews.

grant select on public.coupons to authenticated;

create policy product_images_admin_read on public.product_images for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

create policy product_phone_models_admin_read on public.product_phone_models for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

create policy reviews_admin_read on public.reviews for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

-- Public catalog uploads still require a current staff role. Database catalog
-- writes are performed by the admin-catalog Edge Function after another role
-- check; the service credential never reaches the browser.
create policy product_media_staff_insert on storage.objects for insert to authenticated
with check (
  bucket_id in ('product-images', 'phone-mockups')
  and (select private.current_user_role()) in ('owner', 'admin', 'staff')
);

create policy product_media_staff_update on storage.objects for update to authenticated
using (
  bucket_id in ('product-images', 'phone-mockups')
  and (select private.current_user_role()) in ('owner', 'admin', 'staff')
)
with check (
  bucket_id in ('product-images', 'phone-mockups')
  and (select private.current_user_role()) in ('owner', 'admin', 'staff')
);

create policy product_media_staff_delete on storage.objects for delete to authenticated
using (
  bucket_id in ('product-images', 'phone-mockups')
  and (select private.current_user_role()) in ('owner', 'admin', 'staff')
);

create unique index if not exists product_images_one_primary_idx
on public.product_images(product_id) where is_primary;
