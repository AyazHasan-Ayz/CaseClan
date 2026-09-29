-- Non-destructive bootstrap of the current CASECLAN storefront catalog.
-- Existing rows are preserved; only missing slugs and mappings are inserted.

insert into public.phone_models (slug, name, brand, status, display_order, metadata)
values
  ('iphone-17', 'iPhone 17', 'iPhone', 'active', 0, '{"source":"caseclan-storefront"}'),
  ('iphone-17-pro', 'iPhone 17 Pro', 'iPhone', 'active', 1, '{"source":"caseclan-storefront"}'),
  ('iphone-17-pro-max', 'iPhone 17 Pro Max', 'iPhone', 'active', 2, '{"source":"caseclan-storefront"}'),
  ('iphone-16', 'iPhone 16', 'iPhone', 'active', 3, '{"source":"caseclan-storefront"}'),
  ('iphone-16-plus', 'iPhone 16 Plus', 'iPhone', 'active', 4, '{"source":"caseclan-storefront"}'),
  ('iphone-16-pro', 'iPhone 16 Pro', 'iPhone', 'active', 5, '{"source":"caseclan-storefront"}'),
  ('iphone-16-pro-max', 'iPhone 16 Pro Max', 'iPhone', 'active', 6, '{"source":"caseclan-storefront"}'),
  ('iphone-15', 'iPhone 15', 'iPhone', 'active', 7, '{"source":"caseclan-storefront"}'),
  ('iphone-15-plus', 'iPhone 15 Plus', 'iPhone', 'active', 8, '{"source":"caseclan-storefront"}'),
  ('iphone-15-pro', 'iPhone 15 Pro', 'iPhone', 'active', 9, '{"source":"caseclan-storefront"}'),
  ('iphone-15-pro-max', 'iPhone 15 Pro Max', 'iPhone', 'active', 10, '{"source":"caseclan-storefront"}')
on conflict (slug) do nothing;

insert into public.products
  (slug, name, kind, status, price, sku, material, collection, artwork_locked, metadata)
values
  ('minimal-name', 'Minimal Name Case', 'ready', 'active', 1299, 'CC-MINIMAL-NAME', 'Premium printed case', 'Ready Designs', true, '{"style":"Minimal Name","clan":"NOIR","colors":["Black"],"rank":1,"imageDevice":"iphone-17","featured":true,"bestSeller":true}'),
  ('signature-style', 'Signature Style Case', 'ready', 'active', 1499, 'CC-SIGNATURE-STYLE', 'Premium printed case', 'Ready Designs', true, '{"style":"Signature Style","clan":"NOIR","colors":["Black"],"rank":2,"imageDevice":"iphone-17-pro","featured":true,"bestSeller":true}'),
  ('initial-name', 'Initial + Name Case', 'ready', 'active', 1499, 'CC-INITIAL-NAME', 'Premium printed case', 'Ready Designs', true, '{"style":"Initial + Name","clan":"NOIR","colors":["Black"],"rank":3,"imageDevice":"iphone-17-pro-max","featured":true}'),
  ('word-cloud', 'Word Cloud Case', 'ready', 'active', 1699, 'CC-WORD-CLOUD', 'Premium printed case', 'Ready Designs', true, '{"style":"Word Cloud","clan":"NOIR","colors":["Black"],"rank":4,"imageDevice":"iphone-16"}'),
  ('photo-collage', 'Photo Collage Case', 'ready', 'active', 1799, 'CC-PHOTO-COLLAGE', 'Premium printed case', 'Ready Designs', true, '{"style":"Photo Collage","clan":"NOIR","colors":["Black"],"rank":5,"imageDevice":"iphone-16-plus"}'),
  ('ayaz-word-cloud', 'Ayaz Word Cloud Case', 'ready', 'active', 1699, 'CC-AYAZ-WORD-CLOUD', 'Premium printed case', 'Ready Designs', true, '{"style":"Word Cloud","clan":"NOIR","colors":["Black"],"rank":6,"imageDevice":"iphone-16-pro"}'),
  ('custom-design', 'Your Custom Design', 'custom', 'active', 1899, 'CC-CUSTOM-DESIGN', 'Premium custom case', 'Design Your Own', false, '{"style":"Custom Upload","clan":"NOIR","colors":["Black"],"rank":7,"imageDevice":"iphone-16-pro-max"}')
on conflict (slug) do nothing;

insert into public.product_phone_models (product_id, phone_model_id, available)
select p.id, m.id, true
from public.products p
cross join public.phone_models m
where p.slug in ('minimal-name','signature-style','initial-name','word-cloud','photo-collage','ayaz-word-cloud','custom-design')
  and m.slug in ('iphone-17','iphone-17-pro','iphone-17-pro-max','iphone-16','iphone-16-plus','iphone-16-pro','iphone-16-pro-max','iphone-15','iphone-15-plus','iphone-15-pro','iphone-15-pro-max')
on conflict (product_id, phone_model_id) do nothing;

insert into public.store_settings (key, value, is_public)
values ('catalog_source', '{"provider":"supabase","version":1}', true)
on conflict (key) do nothing;
