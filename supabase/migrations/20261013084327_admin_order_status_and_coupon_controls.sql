-- Additive controls on the existing order/coupon system. No data is deleted.
alter table public.orders add column if not exists status_updated_at timestamptz;
grant update (status_updated_at) on public.orders to authenticated;

create or replace function private.record_order_status()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status is distinct from old.status then
  if new.status not in ('new','New','Pending','Order Placed','Confirmed','Processing','Printing','Printed','Printing / Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','RTO','On Hold','Refunded','Payment Pending','Payment Review') then
   raise exception 'Invalid order status' using errcode='22023';
  end if;
  new.status_updated_at:=now();
  new.metadata:=new.metadata||jsonb_build_object('shipment_status',new.status,'status_history',case when jsonb_typeof(old.metadata->'status_history')='array' then old.metadata->'status_history' else '[]'::jsonb end||jsonb_build_array(jsonb_build_object('status',new.status,'at',now())));
 end if;
 return new;
end;
$$;
revoke all on function private.record_order_status() from public,anon,authenticated;
create trigger orders_record_status before update of status on public.orders for each row execute function private.record_order_status();

create or replace function public.update_order_fulfilment(order_uuid uuid, changes jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.orders%rowtype; next_status text; m jsonb;
begin
 if auth.uid() is null or coalesce((select private.current_user_role()),'') not in ('owner','admin','staff') then
  raise exception 'Admin permission required' using errcode='42501';
 end if;
 if jsonb_typeof(changes) is distinct from 'object' then raise exception 'Invalid fulfilment data'; end if;
 select * into o from public.orders where id=order_uuid for update;
 if not found then raise exception 'Order not found'; end if;
 next_status:=coalesce(changes->>'shipmentStatus',changes->>'status',o.status);
 if next_status not in ('New','Pending','Order Placed','Confirmed','Processing','Printing','Printed','Printing / Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled','RTO','On Hold','Refunded','Payment Pending','Payment Review') then raise exception 'Invalid order status' using errcode='22023'; end if;
 if changes ? 'fulfilmentStatus' and changes->>'fulfilmentStatus' not in ('Pending','Submitted','In Production','Fulfilled','On Hold','Cancelled') then raise exception 'Invalid fulfilment status'; end if;
 if coalesce(changes->>'trackingUrl','')<>'' and changes->>'trackingUrl' !~ '^https://[^[:space:]]+$' then raise exception 'Tracking URL must use HTTPS'; end if;
 m:=o.metadata||jsonb_build_object('shipment_status',next_status);
 if changes ? 'fulfilmentProvider' then m:=m||jsonb_build_object('fulfilment_provider',changes->>'fulfilmentProvider'); end if;
 if changes ? 'qikinkOrderId' then m:=m||jsonb_build_object('qikink_order_id',nullif(changes->>'qikinkOrderId','')); end if;
 if changes ? 'fulfilmentStatus' then m:=m||jsonb_build_object('fulfilment_status',changes->>'fulfilmentStatus'); end if;
 if changes ? 'trackingUrl' then m:=m||jsonb_build_object('tracking_url',nullif(changes->>'trackingUrl','')); end if;
 update public.orders set status=next_status,
  tracking_id=case when changes ? 'trackingId' then nullif(changes->>'trackingId','') else tracking_id end,
  courier=case when changes ? 'courier' then nullif(changes->>'courier','') else courier end,
  admin_note=case when changes ? 'adminNote' then nullif(changes->>'adminNote','') else admin_note end,
  metadata=m where id=order_uuid returning * into o;
 return jsonb_build_object('status',o.status,'metadata',o.metadata,'tracking_id',o.tracking_id,'courier',o.courier,'admin_note',o.admin_note,'updated_at',o.updated_at,'status_updated_at',o.status_updated_at);
end;
$$;
revoke all on function public.update_order_fulfilment(uuid,jsonb) from public,anon;
grant execute on function public.update_order_fulfilment(uuid,jsonb) to authenticated;

create unique index if not exists coupons_normalized_code_idx on public.coupons (upper(btrim(code)));

-- Retain existing price/settings calculations; strengthen coupon validation.
create or replace function public.checkout_quote(payload jsonb)
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
  quote_items jsonb := '[]'::jsonb;
  result jsonb;
begin
  if account_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload -> 'items') is distinct from 'array' or jsonb_array_length(payload -> 'items') = 0 then raise exception 'Cart is empty'; end if;
  if payment_value is null or payment_value not in ('Online Payment', 'Cash on Delivery') then raise exception 'Unsupported payment method'; end if;

  select value into settings_json from public.store_settings where key = 'storefront';
  settings_json := coalesce(settings_json, '{}'::jsonb);
  if payment_value = 'Cash on Delivery' and coalesce((settings_json ->> 'codEnabled')::boolean, true) is false then raise exception 'Cash on Delivery is currently unavailable'; end if;
  if payment_value = 'Online Payment' and coalesce((settings_json ->> 'onlinePaymentsEnabled')::boolean, true) is false then raise exception 'Online payment is currently unavailable'; end if;


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
    quote_items := quote_items || jsonb_build_array(jsonb_build_object('product_slug',product_row.slug,'phone_model_slug',model_row.slug,'product_id',product_row.id,'model_id',model_row.id,'product_name',product_row.name,'kind',product_row.kind,'sku',coalesce(mapping_row.sku,product_row.sku),'quantity',quantity_value,'unit_price',item_price));
  end loop;

  if coupon_code_value <> '' then
    select * into coupon_row from public.coupons
      where upper(btrim(code)) = coupon_code_value
;
    if not found then raise exception 'Invalid coupon code'; end if;
    if not coupon_row.active then raise exception 'Coupon is inactive'; end if;
    if coupon_row.starts_at is not null and coupon_row.starts_at>now() then raise exception 'Coupon has not started yet'; end if;
    if coupon_row.ends_at is not null and coupon_row.ends_at<=now() then raise exception 'Coupon has expired'; end if;
    if coupon_row.usage_limit is not null and coupon_row.usage_count>=coupon_row.usage_limit then raise exception 'Coupon usage limit has been reached'; end if;
    if nullif(coupon_row.metadata->>'per_user_limit','') is not null and (select count(*) from public.orders where customer_id=account_id and upper(btrim(metadata->>'coupon_code'))=coupon_code_value and payment_status in ('paid','cod_pending','refunded')) >= (coupon_row.metadata->>'per_user_limit')::integer then raise exception 'You have reached this coupon usage limit'; end if;
    if subtotal_value < coupon_row.minimum_cart_value then raise exception 'Coupon minimum order value is not met'; end if;
    discount_value := case when coupon_row.discount_type = 'percentage'
      then round(subtotal_value * coupon_row.value / 100, 2)
      else coupon_row.value end;
    if nullif(coupon_row.metadata ->> 'maximum_discount', '') is not null then
      discount_value := least(discount_value, (coupon_row.metadata ->> 'maximum_discount')::numeric);
    end if;
    discount_value := greatest(0, least(discount_value, subtotal_value));
  end if;

  shipping_value := case when subtotal_value - discount_value >= coalesce((settings_json ->> 'freeShippingThreshold')::numeric, 999) then 0 else greatest(0, coalesce((settings_json ->> 'shippingCharge')::numeric, 0)) end;
  cod_value := case when payment_value = 'Cash on Delivery' then greatest(0, coalesce((settings_json ->> 'codFee')::numeric, 0)) else 0 end;
  result := jsonb_build_object('subtotal',subtotal_value,'discount_amount',discount_value,'shipping_amount',shipping_value,'cod_fee',cod_value,'total',subtotal_value-discount_value+shipping_value+cod_value,'currency','INR','items',quote_items);
  return result || jsonb_build_object('fingerprint',md5(result::text));
end;
$$;
revoke all on function public.checkout_quote(jsonb) from public, anon;
grant execute on function public.checkout_quote(jsonb) to authenticated;

