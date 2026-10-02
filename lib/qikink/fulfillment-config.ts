import 'server-only';

export type QikinkPhoneModel = 'iphone-17' | 'iphone-17-pro' | 'iphone-17-pro-max';

const envNames: Record<QikinkPhoneModel, string> = {
  'iphone-17': 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17',
  'iphone-17-pro': 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO',
  'iphone-17-pro-max': 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO_MAX',
};

/** One server-only source of truth for CASECLAN phone-model fulfillment mappings. */
export function qikinkStoreSku(device: string) {
  if (!(device in envNames)) throw new Error(`No Qikink sandbox mapping exists for phone model: ${device}`);
  const envName = envNames[device as QikinkPhoneModel];
  const sku = process.env[envName]?.trim();
  if (!sku) throw new Error(`Missing required server environment variable: ${envName}`);
  return sku;
}

