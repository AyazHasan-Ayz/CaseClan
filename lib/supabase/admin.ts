import 'server-only';

import { createSupabaseAdminClient } from './server';
import type { PrivateBucketName } from './storage';

export async function verifySupabaseAdminConnection() {
  const { error } = await createSupabaseAdminClient().auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw error;
  return true;
}

export async function createPrivateAssetUrl(bucket: PrivateBucketName, path: string, expiresIn = 300) {
  const { data, error } = await createSupabaseAdminClient().storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
