-- Non-destructive: historical attempts remain available for support.
create unique index if not exists orders_checkout_key_idx on public.orders(customer_id,(metadata->>'checkout_key')) where metadata ? 'checkout_key';
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

  shipping_value := case when subtotal_value - discount_value >= coalesce((settings_json ->> 'freeShippingThreshold')::numeric, 999) then 0 else greatest(0, coalesce((settings_json ->> 'shippingCharge')::numeric, 0)) end;
  cod_value := case when payment_value = 'Cash on Delivery' then greatest(0, coalesce((settings_json ->> 'codFee')::numeric, 0)) else 0 end;
  result := jsonb_build_object('subtotal',subtotal_value,'discount_amount',discount_value,'shipping_amount',shipping_value,'cod_fee',cod_value,'total',subtotal_value-discount_value+shipping_value+cod_value,'currency','INR','items',quote_items);
  return result || jsonb_build_object('fingerprint',md5(result::text));
end;
$$;
revoke all on function public.checkout_quote(jsonb) from public, anon;
grant execute on function public.checkout_quote(jsonb) to authenticated;

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
  quote jsonb;
  quoted_item jsonb;
  item_index integer := 0;
  request_key text := payload ->> 'checkout_key';
  request_hash text := md5((payload - 'checkout_key' - 'expected_quote')::text);
begin
  if account_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then raise exception 'Cart is empty'; end if;
  if coalesce(shipping_json ->> 'line1', '') = '' or coalesce(shipping_json ->> 'city', '') = '' or coalesce(shipping_json ->> 'state', '') = '' or coalesce(shipping_json ->> 'postal_code','') !~ '^[0-9]{6}$' then raise exception 'A valid shipping address is required'; end if;
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

  quote := public.checkout_quote(payload);
  if payload ->> 'expected_quote' is distinct from quote ->> 'fingerprint' then raise exception 'Prices changed. Review the updated checkout total before paying.'; end if;
  if request_key is null or length(request_key)>100 then raise exception 'Checkout key required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(account_id::text || request_key,0));
  select * into new_order from public.orders where customer_id=account_id and metadata->>'checkout_key'=request_key;
  if found then
    if new_order.metadata->>'request_hash' is distinct from request_hash then raise exception 'Checkout contents changed. Please start again.'; end if;
    return jsonb_build_object('id',new_order.id,'order_number','CC-'||lpad(new_order.order_number::text,8,'0'),'status',new_order.status,'payment_status',new_order.payment_status,'subtotal',new_order.subtotal,'shipping_amount',new_order.shipping_amount,'discount_amount',new_order.discount_amount,'cod_fee',new_order.cod_fee,'total',new_order.total);
  end if;
  subtotal_value := (quote->>'subtotal')::numeric;
  shipping_value := (quote->>'shipping_amount')::numeric;
  discount_value := (quote->>'discount_amount')::numeric;
  cod_value := (quote->>'cod_fee')::numeric;
  insert into public.orders (customer_id, status, payment_status, payment_method, currency, subtotal, shipping_amount, discount_amount, cod_fee, total, shipping_address, metadata)
  values (account_id, 'new', 'not_processed', payment_value, coalesce(settings_json ->> 'currency', 'INR'), subtotal_value, shipping_value, discount_value, cod_value, subtotal_value + shipping_value - discount_value + cod_value, shipping_json,
    jsonb_build_object('checkout_key',request_key,'request_hash',request_hash,'quote',quote,'coupon_code', nullif(coupon_code_value, ''), 'fulfilment_provider', 'Qikink', 'fulfilment_status', 'Pending', 'shipment_status', 'Order Placed', 'status_history', jsonb_build_array(jsonb_build_object('status', 'Order Placed', 'at', now()))))
  returning * into new_order;

  for item in select value from jsonb_array_elements(payload -> 'items') loop
    quoted_item := quote->'items'->item_index;
    item_index := item_index+1;
    quantity_value := (quoted_item->>'quantity')::integer;
    select * into product_row from public.products where id=(quoted_item->>'product_id')::uuid;
    select * into model_row from public.phone_models where id=(quoted_item->>'model_id')::uuid;
    item_price := (quoted_item->>'unit_price')::numeric;
    insert into public.order_items (order_id, product_id, phone_model_id, product_name, sku, quantity, unit_price, fixed_design_id, item_type, metadata)
    values (new_order.id, product_row.id, model_row.id, product_row.name, quoted_item->>'sku', quantity_value, item_price, item ->> 'fixed_design_id', case when product_row.kind = 'custom' then 'custom-case' else 'ready-design' end, '{}'::jsonb)
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

  return jsonb_build_object('id', new_order.id, 'order_number', 'CC-' || lpad(new_order.order_number::text, 8, '0'), 'status', new_order.status, 'payment_status', new_order.payment_status, 'subtotal', new_order.subtotal, 'shipping_amount', new_order.shipping_amount, 'discount_amount', new_order.discount_amount, 'cod_fee', new_order.cod_fee, 'total', new_order.total);
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

-- Existing Edge Functions already have service-only payment write access.
-- These RPCs make those same operations atomic without exposing private events.
create or replace function public.prepare_payment(order_uuid uuid, operation text, details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; p public.payments%rowtype; provider_value text;
begin
 select * into o from public.orders where id=order_uuid for update;
 if not found then raise exception 'Order not found'; end if;
 provider_value := case when operation='cod' then 'cod' else 'razorpay' end;
 if operation='cod' then
   if o.payment_method not in ('cod','Cash on Delivery') then raise exception 'Not a COD order'; end if;
   insert into public.payments(order_id,customer_id,provider,expected_amount,currency,status,payment_method)
   values(o.id,o.customer_id,'cod',round(o.total*100),'INR','pending','cod') on conflict(order_id,provider) do nothing;
   if o.payment_status <> 'cod_pending' then
     update public.orders set payment_method='cod',payment_status='cod_pending',status='Confirmed',metadata=metadata||jsonb_build_object('confirmed_at',now(),'shipment_status','Confirmed') where id=o.id;
     update public.coupons set usage_count=usage_count+1 where code=o.metadata->>'coupon_code';
   end if;
   return jsonb_build_object('status','Confirmed','paymentStatus','cod_pending');
 end if;
 if o.payment_method not in ('razorpay','Online Payment') then raise exception 'Not an online payment order'; end if;
 if o.payment_status in ('paid','refunded') then raise exception 'Order already paid'; end if;
 select * into p from public.payments where order_id=o.id and provider='razorpay' for update;
 if p.provider_order_id is not null then return to_jsonb(p); end if;
 if operation='claim' then
   if p.id is not null then raise exception 'Payment initialization is already in progress. Please retry shortly; support can reconcile an interrupted initialization.'; end if;
   insert into public.payments(order_id,customer_id,provider,expected_amount,currency,status,metadata)
   values(o.id,o.customer_id,'razorpay',round(o.total*100),'INR','pending',jsonb_build_object('initializing',true)) returning * into p;
 elsif operation='attach' then
   if p.id is null or nullif(details->>'provider_order_id','') is null then raise exception 'Missing payment initialization'; end if;
   update public.payments set provider_order_id=details->>'provider_order_id',metadata=metadata||jsonb_build_object('initializing',false) where id=p.id returning * into p;
   update public.orders set payment_method='razorpay',payment_status='pending',status='Pending' where id=o.id;
 else raise exception 'Unsupported operation'; end if;
 return to_jsonb(p);
end;
$$;
revoke all on function public.prepare_payment(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.prepare_payment(uuid,text,jsonb) to service_role;

create or replace function public.settle_payment(provider_order text, new_status text, details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.payments%rowtype; o public.orders%rowtype; event_key text := details->>'event_id';
begin
 select * into p from public.payments where provider_order_id=provider_order;
 if not found then raise exception 'Payment initialization not yet attached'; end if;
 select * into o from public.orders where id=p.order_id for update;
 select * into p from public.payments where id=p.id for update;
 if event_key is not null then
   insert into private.payment_events(provider_event_id,event_type,provider_order_id,provider_payment_id,payload)
   values(event_key,coalesce(details->>'event_type',new_status),provider_order,details->>'payment_id',details)
   on conflict(provider_event_id) do nothing;
   if not found then return jsonb_build_object('orderId',o.id,'status',p.status,'duplicate',true); end if;
 end if;
 if new_status='refunded' and p.status='paid' then
   if coalesce((details->>'signature_verified')::boolean,false) is false or details->>'payment_id' is distinct from p.provider_payment_id then raise exception 'Invalid refund'; end if;
   update public.payments set metadata=metadata||jsonb_build_object('refund',details) where id=p.id;
   if (details->>'amount_refunded')::bigint >= p.expected_amount then
     update public.payments set status='refunded' where id=p.id;
     update public.orders set payment_status='refunded',status='Refunded' where id=o.id;
   end if;
   return jsonb_build_object('orderId',o.id,'status','refund_processed');
 end if;
 if p.status in ('paid','refunded') then return jsonb_build_object('orderId',o.id,'status',p.status,'duplicate',true,'verifiedAt',p.verified_at); end if;
 if new_status='paid' then
   if coalesce((details->>'signature_verified')::boolean,false) is false
      or nullif(details->>'payment_id','') is null
      or (details->>'amount')::bigint is distinct from p.expected_amount
      or p.expected_amount <> round(o.total*100)
      or details->>'currency' is distinct from p.currency then raise exception 'Verified payment amount/currency mismatch'; end if;
   update public.payments set status='paid',provider_payment_id=details->>'payment_id',received_amount=(details->>'amount')::bigint,
     signature_verified=true,verified_at=now(),payment_method=details->>'method' where id=p.id;
   update public.orders set payment_status='paid',status='Confirmed',metadata=metadata||jsonb_build_object('confirmed_at',now(),'shipment_status','Confirmed','status_history',jsonb_build_array(jsonb_build_object('status','Confirmed','at',now()))) where id=o.id;
   update public.coupons set usage_count=usage_count+1 where code=o.metadata->>'coupon_code';
 elsif new_status in ('failed','cancelled','amount_mismatch') then
   update public.payments set status=new_status,metadata=metadata||jsonb_build_object('last_failure',details) where id=p.id;
   update public.orders set payment_status=new_status,status='Payment Pending' where id=o.id;
 else raise exception 'Unsupported payment transition'; end if;
 return jsonb_build_object('orderId',o.id,'status',new_status,'verifiedAt',case when new_status='paid' then now() else null end);
end;
$$;
revoke all on function public.settle_payment(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.settle_payment(text,text,jsonb) to service_role;
