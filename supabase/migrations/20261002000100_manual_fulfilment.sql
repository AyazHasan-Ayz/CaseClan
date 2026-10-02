-- Manual fulfilment workflow and private production asset handoff.

grant update (status, tracking_id, courier, admin_note, metadata) on public.orders to authenticated;

drop policy if exists orders_admin_update_fulfilment on public.orders;
create policy orders_admin_update_fulfilment on public.orders
for update to authenticated
using ((select private.current_user_role()) in ('owner', 'admin', 'staff'))
with check ((select private.current_user_role()) in ('owner', 'admin', 'staff'));

drop policy if exists print_ready_read_own on storage.objects;
create policy print_ready_read_own on storage.objects for select to authenticated
using (bucket_id = 'print-ready' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists print_ready_insert_own on storage.objects;
create policy print_ready_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'print-ready' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists print_ready_update_own on storage.objects;
create policy print_ready_update_own on storage.objects for update to authenticated
using (bucket_id = 'print-ready' and owner_id = (select auth.uid())::text)
with check (bucket_id = 'print-ready' and (storage.foldername(name))[1] = (select auth.uid())::text);

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
  preview_value text;
  print_value text;
  upload_values text[];
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
  insert into public.orders (customer_id, status, payment_status, payment_method, currency, subtotal, shipping_amount, discount_amount, cod_fee, total, shipping_address, metadata)
  values (account_id, 'new', 'not_processed', payment_value, 'INR', subtotal_value, shipping_value, 0, cod_value, subtotal_value + shipping_value + cod_value, shipping_json,
    jsonb_build_object('fulfilment_provider', 'Qikink', 'fulfilment_status', 'Pending', 'shipment_status', 'Order Placed', 'status_history', jsonb_build_array(jsonb_build_object('status', 'Order Placed', 'at', now()))))
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
      preview_value := nullif(item ->> 'preview_path', '');
      print_value := nullif(item ->> 'print_ready_path', '');
      select coalesce(array_agg(value), '{}'::text[]) into upload_values
      from jsonb_array_elements_text(coalesce(item -> 'customer_upload_paths', '[]'::jsonb));
      if preview_value is not null and split_part(preview_value, '/', 1) <> account_id::text then raise exception 'Invalid preview path'; end if;
      if print_value is not null and split_part(print_value, '/', 1) <> account_id::text then raise exception 'Invalid print path'; end if;
      if exists (select 1 from unnest(upload_values) path where split_part(path, '/', 1) <> account_id::text) then raise exception 'Invalid upload path'; end if;
      insert into public.customizations (order_item_id, customer_id, design_state, customer_upload_paths, preview_path, print_ready_path, metadata)
      values (new_item.id, account_id, coalesce(item -> 'design_state', '{}'::jsonb), upload_values, preview_value, print_value, jsonb_build_object('preview_reference', item ->> 'preview'));
    end if;
  end loop;

  return jsonb_build_object('id', new_order.id, 'order_number', 'CC-' || lpad(new_order.order_number::text, 8, '0'), 'status', new_order.status, 'payment_status', new_order.payment_status, 'subtotal', new_order.subtotal, 'shipping_amount', new_order.shipping_amount, 'cod_fee', new_order.cod_fee, 'total', new_order.total);
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
