-- CASECLAN authentication, role security, and atomic authenticated checkout.

alter table public.customers
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'owner', 'admin', 'staff'));

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.customers where id = (select auth.uid());
$$;
revoke all on function private.current_user_role() from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.customers (id, email, phone, full_name, role)
  values (new.id, new.email, new.phone, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'customer')
  on conflict (id) do update set
    email = excluded.email,
    phone = coalesce(excluded.phone, public.customers.phone),
    full_name = coalesce(excluded.full_name, public.customers.full_name);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email, phone, raw_user_meta_data on auth.users
for each row execute function private.handle_new_user();

insert into public.customers (id, email, phone, full_name, role)
select id, email, phone, nullif(btrim(raw_user_meta_data ->> 'full_name'), ''), 'customer'
from auth.users
on conflict (id) do nothing;

drop policy if exists customers_insert_own on public.customers;
revoke insert, update on public.customers from authenticated;
grant update (email, phone, full_name, metadata) on public.customers to authenticated;

create policy customers_admin_read on public.customers for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

create policy addresses_admin_read on public.addresses for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy orders_admin_read on public.orders for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy order_items_admin_read on public.order_items for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy customizations_admin_read on public.customizations for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

create policy products_admin_read on public.products for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy phone_models_admin_read on public.phone_models for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy coupons_admin_read on public.coupons for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy store_settings_admin_read on public.store_settings for select to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  item jsonb;
  product_row public.products%rowtype;
  model_row public.phone_models%rowtype;
  mapping_row public.product_phone_models%rowtype;
  new_order public.orders%rowtype;
  new_item public.order_items%rowtype;
  item_price numeric(12,2);
  subtotal_value numeric(12,2) := 0;
  shipping_value numeric(12,2);
  cod_value numeric(12,2);
  quantity_value integer;
  shipping_json jsonb := payload -> 'shipping_address';
  payment_value text := payload ->> 'payment_method';
begin
  if account_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then raise exception 'Cart is empty'; end if;
  if coalesce(shipping_json ->> 'line1', '') = '' or coalesce(shipping_json ->> 'city', '') = '' or coalesce(shipping_json ->> 'state', '') = '' or (shipping_json ->> 'postal_code') !~ '^[0-9]{6}$' then raise exception 'A valid shipping address is required'; end if;
  if payment_value not in ('Online Payment', 'Cash on Delivery') then raise exception 'Unsupported payment method'; end if;

  update public.customers set
    full_name = nullif(btrim(payload #>> '{customer,full_name}'), ''),
    email = coalesce(nullif(btrim(payload #>> '{customer,email}'), ''), email),
    phone = nullif(btrim(payload #>> '{customer,phone}'), '')
  where id = account_id;

  for item in select value from jsonb_array_elements(payload -> 'items') loop
    quantity_value := greatest(1, least(10, coalesce((item ->> 'quantity')::integer, 1)));
    select * into product_row from public.products where slug = item ->> 'product_slug' and status = 'active';
    if not found then raise exception 'Unavailable product: %', item ->> 'product_slug'; end if;
    select * into model_row from public.phone_models where slug = item ->> 'phone_model_slug' and status = 'active';
    if not found then raise exception 'Unavailable phone model: %', item ->> 'phone_model_slug'; end if;
    select * into mapping_row from public.product_phone_models where product_id = product_row.id and phone_model_id = model_row.id and available;
    if not found then raise exception 'Product is unavailable for this phone model'; end if;
    item_price := coalesce(mapping_row.price_override, product_row.price);
    subtotal_value := subtotal_value + item_price * quantity_value;
  end loop;

  shipping_value := case when subtotal_value >= 999 then 0 else 99 end;
  cod_value := case when payment_value = 'Cash on Delivery' then 99 else 0 end;
  insert into public.orders (customer_id, status, payment_status, payment_method, currency, subtotal, shipping_amount, discount_amount, cod_fee, total, shipping_address)
  values (account_id, 'new', 'not_processed', payment_value, 'INR', subtotal_value, shipping_value, 0, cod_value, subtotal_value + shipping_value + cod_value, shipping_json)
  returning * into new_order;

  for item in select value from jsonb_array_elements(payload -> 'items') loop
    quantity_value := greatest(1, least(10, coalesce((item ->> 'quantity')::integer, 1)));
    select * into product_row from public.products where slug = item ->> 'product_slug';
    select * into model_row from public.phone_models where slug = item ->> 'phone_model_slug';
    select * into mapping_row from public.product_phone_models where product_id = product_row.id and phone_model_id = model_row.id;
    item_price := coalesce(mapping_row.price_override, product_row.price);
    insert into public.order_items (order_id, product_id, phone_model_id, product_name, sku, quantity, unit_price, fixed_design_id, item_type, metadata)
    values (new_order.id, product_row.id, model_row.id, product_row.name, coalesce(mapping_row.sku, product_row.sku), quantity_value, item_price, item ->> 'fixed_design_id', case when product_row.kind = 'custom' then 'custom-case' else 'ready-design' end, '{}'::jsonb)
    returning * into new_item;
    if product_row.kind = 'custom' then
      insert into public.customizations (order_item_id, customer_id, design_state, metadata)
      values (new_item.id, account_id, coalesce(item -> 'design_state', '{}'::jsonb), jsonb_build_object('preview_reference', item ->> 'preview'));
    end if;
  end loop;

  return jsonb_build_object('id', new_order.id, 'order_number', 'CC-' || lpad(new_order.order_number::text, 8, '0'), 'status', new_order.status, 'payment_status', new_order.payment_status, 'subtotal', new_order.subtotal, 'shipping_amount', new_order.shipping_amount, 'cod_fee', new_order.cod_fee, 'total', new_order.total);
end;
$$;
revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

create policy print_ready_admin_read on storage.objects for select to authenticated
using (bucket_id = 'print-ready' and (select private.current_user_role()) in ('owner', 'admin', 'staff'));
create policy customer_assets_admin_read on storage.objects for select to authenticated
using (bucket_id in ('customer-uploads', 'custom-previews') and (select private.current_user_role()) in ('owner', 'admin', 'staff'));
