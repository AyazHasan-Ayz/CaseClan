/** CMS is opt-in. Existing storefront and commerce do not depend on CMS setup. */
export function isCmsEnabled(env: Record<string, string | undefined> = process.env) {
 return env.NEXT_PUBLIC_CMS_ENABLED === 'true' &&
  !!env.NEXT_PUBLIC_SANITY_PROJECT_ID && !!env.NEXT_PUBLIC_SANITY_DATASET;
}
