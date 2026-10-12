-- CMS publishing is one transaction. Only the server service role may call it.
create or replace function public.publish_cms_product(payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
 published_product_id uuid;
 model record;
 image jsonb;
 source_id text := payload->>'sanityId';
 position integer := 0;
begin
 if coalesce(source_id,'')='' or coalesce(payload->>'name','')='' or coalesce(payload->>'slug','')='' then raise exception 'Invalid CMS product'; end if;
 if payload->>'price' is null or (payload->>'price')::numeric < 0 or coalesce(jsonb_typeof(payload->'images'),'')<>'array' or jsonb_array_length(payload->'images')=0 then raise exception 'Invalid product price/images'; end if;
 if payload->>'status' is null or payload->>'kind' is null or coalesce(jsonb_typeof(payload->'devices'),'')<>'array' or payload->>'status' not in ('active','draft','archived') or payload->>'kind' not in ('ready','custom') then raise exception 'Invalid product state'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cms-product:'||source_id,0));
 if coalesce(payload->>'commerceId','')<>'' then
  select id into published_product_id from public.products where id=(payload->>'commerceId')::uuid for update;
  if published_product_id is null then raise exception 'Imported commerce product no longer exists'; end if;
 else
  select id into published_product_id from public.products where metadata->>'sanityId'=source_id for update;
 end if;
 if payload->>'status'='active' and (jsonb_array_length(payload->'devices')=0 or
  exists(select 1 from jsonb_array_elements_text(payload->'devices') d where not exists(select 1 from public.phone_models m where m.slug=d))) then raise exception 'Publish compatible phones first'; end if;
 if published_product_id is null then
  insert into public.products(slug,name,price,kind,status,metadata)
   values(payload->>'slug',payload->>'name',(payload->>'price')::numeric,payload->>'kind','draft','{}') returning id into published_product_id;
 end if;
 update public.products set slug=payload->>'slug',name=payload->>'name',price=(payload->>'price')::numeric,
  compare_at_price=nullif(payload->>'compareAtPrice','')::numeric,kind=payload->>'kind',status=payload->>'status',
  description=payload->>'description',short_description=payload->>'shortDescription',material=payload->>'material',
  collection=coalesce(payload->>'category','Ready Designs'),artwork_locked=(payload->>'kind')<>'custom',
  metadata=metadata||coalesce(payload->'metadata','{}')||jsonb_build_object('sanityId',source_id,'sanityRevision',payload->>'revision') where id=published_product_id;
 update public.product_phone_models set available=false where product_phone_models.product_id=published_product_id;
 for model in select id from public.phone_models where slug in (select jsonb_array_elements_text(payload->'devices')) loop
  insert into public.product_phone_models(product_id,phone_model_id,available) values(published_product_id,model.id,true)
  on conflict(product_id,phone_model_id) do update set available=true;
 end loop;
 update public.product_images set is_primary=false where product_images.product_id=published_product_id;
 for image in select value from jsonb_array_elements(payload->'images') loop
  if image->>'url' not like 'https://cdn.sanity.io/%' then raise exception 'Sanity image asset required'; end if;
  insert into public.product_images(product_id,storage_path,alt_text,sort_order,is_primary)
   values(published_product_id,image->>'url',coalesce(image->>'alt',payload->>'name'),position,position=0)
  on conflict(product_id,storage_path) do update set alt_text=excluded.alt_text,sort_order=excluded.sort_order,is_primary=excluded.is_primary;
  position := position+1;
 end loop;
 -- Remove obsolete associations, preserving storage files and all historical order data.
 delete from public.product_images where product_images.product_id=published_product_id and storage_path not in (select value->>'url' from jsonb_array_elements(payload->'images'));
 return published_product_id;
end;
$$;
revoke all on function public.publish_cms_product(jsonb) from public,anon,authenticated;
grant execute on function public.publish_cms_product(jsonb) to service_role;
