export const SUPABASE_BUCKETS = {
  productImages: { name: 'product-images', public: true },
  phoneMockups: { name: 'phone-mockups', public: true },
  customerUploads: { name: 'customer-uploads', public: false },
  customPreviews: { name: 'custom-previews', public: false },
  printReady: { name: 'print-ready', public: false },
} as const;

export type PrivateBucketName =
  | typeof SUPABASE_BUCKETS.customerUploads.name
  | typeof SUPABASE_BUCKETS.customPreviews.name
  | typeof SUPABASE_BUCKETS.printReady.name;

export function customerAssetPath(customerId: string, filename: string) {
  const safeName = filename.normalize('NFKC').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!customerId || !safeName) throw new Error('A customer ID and safe filename are required.');
  return `${customerId}/${crypto.randomUUID()}-${safeName}`;
}
