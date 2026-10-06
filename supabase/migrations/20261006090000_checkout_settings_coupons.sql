-- Apply live store settings and coupons inside the security-definer checkout.
-- The browser never supplies prices, discounts, shipping fees, or payment fees.
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
  coupon_row public.coupons%rowtype;
  new_order public.orders%rowtype;
  new_item public.order_items%rowtype;
  item_price numeric(12,2);
  subtotal_value numeric(12,2) := 0;
  shipping_value numeric(12,2);
  discount_value numeric(12,2) := 0;
  cod_value numeric(12,2);
  quantity_value integer;
  shipping_json jsonb := payload -> 'shipping_address';
  payment_value text := payload ->> 'payment_method';
  coupon_code_value text := upper(btrim(coalesce(payload ->> 'coupon_code', '')));
  settings_json jsonb := '{}'::jsonb;
  preview_value text;
  print_value text;
  upload_values text[];
begin
  if account_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then raise exception 'Cart is empty'; end if;
  if coalesce(shipping_json ->> 'line1', '') = '' or coalesce(shipping_json ->> 'city', '') = '' or coalesce(shipping_json ->> 'state', '') = '' or (shipping_json ->> 'postal_code') !~ '^[0-9]{6}$' then raise exception 'A valid shipping address is required'; end if;
  if payment_value not in ('Online Payment', 'Cash on Delivery') then raise exception 'Unsupported payment method'; end if;

  select value into settings_json from public.store_settings where key = 'storefront';
  settings_json := coalesce(settings_json, '{}'::jsonb);
  if payment_value = 'Cash on Delivery' and coalesce((settings_json ->> 'codEnabled')::boolean, true) is false then raise exception 'Cash on Delivery is currently unavailable'; end if;
  if payment_value = 'Online Payment' and coalesce((settings_json ->> 'onlinePaymentsEnabled')::boolean, true) is false then raise exception 'Online payment is currently unavailable'; end if;

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

  if coupon_code_value <> '' then
    select * into coupon_row from public.coupons
      where code = coupon_code_value
        and active
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now())
        and (usage_limit is null or usage_count < usage_limit);
    if not found then raise exception 'Coupon is invalid, expired, or unavailable'; end if;
    if subtotal_value < coupon_row.minimum_cart_value then raise exception 'Coupon minimum order value is not met'; end if;
    discount_value := case when coupon_row.discount_type = 'percentage'
      then round(subtotal_value * coupon_row.value / 100, 2)
      else coupon_row.value end;
    if nullif(coupon_row.metadata ->> 'maximum_discount', '') is not null then
      discount_value := least(discount_value, (coupon_row.metadata ->> 'maximum_discount')::numeric);
    end if;
    discount_value := greatest(0, least(discount_value, subtotal_value));
  end if;

  shipping_value := case when subtotal_value - discount_value >= coalesce((settings_json ->> 'freeShippingThreshold')::numeric, 999) then 0 else coalesce((settings_json ->> 'shippingCharge')::numeric, 99) end;
  cod_value := case when payment_value = 'Cash on Delivery' then coalesce((settings_json ->> 'codFee')::numeric, 99) else 0 end;
  insert into public.orders (customer_id, status, payment_status, payment_method, currency, subtotal, shipping_amount, discount_amount, cod_fee, total, shipping_address, metadata)
  values (account_id, 'new', 'not_processed', payment_value, coalesce(settings_json ->> 'currency', 'INR'), subtotal_value, shipping_value, discount_value, cod_value, subtotal_value + shipping_value - discount_value + cod_value, shipping_json,
    jsonb_build_object('coupon_code', nullif(coupon_code_value, ''), 'fulfilment_provider', 'Qikink', 'fulfilment_status', 'Pending', 'shipment_status', 'Order Placed', 'status_history', jsonb_build_array(jsonb_build_object('status', 'Order Placed', 'at', now()))))
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

  if coupon_code_value <> '' then
    update public.coupons set usage_count = usage_count + 1 where id = coupon_row.id;
  end if;

  return jsonb_build_object('id', new_order.id, 'order_number', 'CC-' || lpad(new_order.order_number::text, 8, '0'), 'status', new_order.status, 'payment_status', new_order.payment_status, 'subtotal', new_order.subtotal, 'shipping_amount', new_order.shipping_amount, 'discount_amount', new_order.discount_amount, 'cod_fee', new_order.cod_fee, 'total', new_order.total);
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;
