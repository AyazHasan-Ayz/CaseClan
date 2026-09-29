'use client';

import type { AdminData } from '@/lib/admin';
import type { Device, Product } from '@/lib/catalog';
import { createSupabaseBrowserClient } from './client';
import type { Json } from './types';

type JsonObject = Record<string, Json | undefined>;

function objectValue(value: Json | undefined): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function stringArray(value: Json | undefined, fallback: string[]) {
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value as string[] : fallback;
}

export async function fetchRemoteCatalog(fallback: AdminData): Promise<AdminData | null> {
  const client = createSupabaseBrowserClient();
  const [productsResult, modelsResult, mappingsResult, settingsResult] = await Promise.all([
    client.from('products').select('*').eq('status', 'active').order('created_at'),
    client.from('phone_models').select('*').eq('status', 'active').order('display_order'),
    client.from('product_phone_models').select('*').eq('available', true),
    client.from('store_settings').select('key,value').eq('is_public', true),
  ]);

  const error = productsResult.error || modelsResult.error || mappingsResult.error || settingsResult.error;
  if (error) throw error;
  if (!productsResult.data?.length || !modelsResult.data?.length) return null;

  const fallbackProducts = new Map(fallback.products.map(product => [product.id, product]));
  const fallbackDevices = new Map(fallback.devices.map(device => [device.slug, device]));
  const modelSlugById = new Map(modelsResult.data.map(model => [model.id, model.slug]));
  const deviceSlugsByProduct = new Map<string, string[]>();
  for (const mapping of mappingsResult.data || []) {
    const slug = modelSlugById.get(mapping.phone_model_id);
    if (slug) deviceSlugsByProduct.set(mapping.product_id, [...(deviceSlugsByProduct.get(mapping.product_id) || []), slug]);
  }

  const remoteDevices: Device[] = modelsResult.data.map(model => {
    const existing = fallbackDevices.get(model.slug);
    return {
      name: model.name,
      slug: model.slug,
      brand: model.brand,
      image: existing?.image ?? model.display_order,
      active: true,
      available: true,
      displayOrder: model.display_order,
      mockup: existing?.mockup,
    };
  });

  const remoteProducts: Product[] = productsResult.data.map(row => {
    const existing = fallbackProducts.get(row.slug);
    const metadata = objectValue(row.metadata);
    const compatibleDevices = deviceSlugsByProduct.get(row.id) || existing?.devices || remoteDevices.map(device => device.slug);
    return {
      id: row.slug,
      name: row.name,
      price: Number(row.price),
      clan: (typeof metadata.clan === 'string' ? metadata.clan : existing?.clan || 'NOIR') as Product['clan'],
      devices: compatibleDevices,
      colors: stringArray(metadata.colors, existing?.colors || ['Black']),
      material: row.material || existing?.material || 'Premium printed case',
      style: typeof metadata.style === 'string' ? metadata.style : existing?.style || row.name,
      magsafe: typeof metadata.magsafe === 'boolean' ? metadata.magsafe : existing?.magsafe || false,
      rating: typeof metadata.rating === 'number' ? metadata.rating : existing?.rating || 0,
      reviews: typeof metadata.reviews === 'number' ? metadata.reviews : existing?.reviews || 0,
      collection: row.collection || existing?.collection || 'Ready Designs',
      rank: typeof metadata.rank === 'number' ? metadata.rank : existing?.rank || 999,
      imageDevice: typeof metadata.imageDevice === 'string' ? metadata.imageDevice : existing?.imageDevice || compatibleDevices[0],
      kind: row.kind,
      image: existing?.image,
      gallery: existing?.gallery,
      sku: row.sku || existing?.sku,
      compareAtPrice: row.compare_at_price == null ? existing?.compareAtPrice : Number(row.compare_at_price),
      costPrice: row.cost_price == null ? existing?.costPrice : Number(row.cost_price),
      shortDescription: row.short_description || existing?.shortDescription,
      description: row.description || existing?.description,
      status: row.status,
      featured: typeof metadata.featured === 'boolean' ? metadata.featured : existing?.featured,
      bestSeller: typeof metadata.bestSeller === 'boolean' ? metadata.bestSeller : existing?.bestSeller,
      newArrival: typeof metadata.newArrival === 'boolean' ? metadata.newArrival : existing?.newArrival,
      seoTitle: existing?.seoTitle,
      metaDescription: existing?.metaDescription,
      createdAt: row.created_at,
      modelPrices: existing?.modelPrices,
    };
  });

  const publicSettings = Object.fromEntries((settingsResult.data || []).map(setting => [setting.key, setting.value]));
  return {
    ...fallback,
    products: remoteProducts,
    devices: remoteDevices,
    settings: { ...fallback.settings, ...(objectValue(publicSettings.storefront) as Partial<AdminData['settings']>) },
  };
}
