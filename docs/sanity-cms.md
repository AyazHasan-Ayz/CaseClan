# CASECLAN content editing

## Current status

CMS setup was paused at the owner's request on 2026-10-10. All CMS code, schemas, import tooling, and migrations are preserved. `NEXT_PUBLIC_CMS_ENABLED` defaults to disabled; Sanity identifiers alone do not activate it. Storefront content uses existing fallbacks, Studio/preview are paused, and the publish webhook returns 503 without synchronizing commerce data. No further CMS/Supabase setup or deployment is being performed.

Before pausing, 37 content documents and 13 media assets were imported into Sanity project `nuc0c50h` (dataset `production`). Additive migration `20261009164319_cms_catalog_publication.sql` was applied remotely; its insert/read test was rolled back and left zero QA products. The approved production and localhost:3000 CORS origins were saved. Public Sanity identifiers were saved to Vercel, but remain inert while CMS is disabled. Private CMS deployment secrets and live publishing tests remain incomplete. No CMS build has been deployed.

Existing Supabase commerce/authentication stays enabled when its existing configuration is present. Missing public configuration no longer crashes the authentication provider: browsing, the blank customizer, and guest cart remain available. Sign-in and real order processing still require the existing backend and retain their security checks. Disabling CMS does not disable working commerce or bypass checkout authentication.

To resume later, finish the configuration and acceptance checklist below before setting `NEXT_PUBLIC_CMS_ENABLED=true` and deploying. Keep private tokens server-only.

Pause verification: 63 tests passed and the production build generated 113 pages with all Sanity and Supabase configuration variables empty. A temporary production server returned HTTP 200 for homepage, customizer, cart, login, Studio and preview routes without missing-environment errors. The disabled publish endpoint returned HTTP 503 with `CMS setup is paused.` Browser interaction checks were unavailable because the in-app browser could not reach the local test server. The existing live deployment was left unchanged.

Local verification on 2026-10-09: 62 regression/CMS tests passed; the Next.js production build passed. The read-only import plan prepared 37 documents from the remote Supabase catalog. Desktop homepage/product rendering and mobile customizer checks at 390px and 320px showed no horizontal overflow or captured console errors. A bright red SVG upload filled the printable case back while preserving the camera exclusion, clear edges, and highlights. Missing webhook configuration returned 503; a cross-origin preview request returned 403. Real configured webhook signatures, live draft reads, remote publication, and successful Razorpay payment capture remain unverified.

The final local build displayed the current Mercedes product at INR 599 with six gallery images; nine visible image sources used Next.js optimization. Guest Add to Cart succeeded, the cart survived navigation to login, and checkout returned `/login/?next=%2Fcheckout%2F`. The temporary local cart item was removed afterward. No order or payment was submitted.

## Architecture

- `/studio/` embeds Sanity Studio. Editing requires a Sanity project member with write access; public visitors cannot edit documents. Keep project membership restricted to the store team.
- `/content-preview/` enables draft preview only after the server verifies the current Supabase user and owner/admin database role. Private read tokens never enter browser bundles. Preview product purchases are disabled.
- Published presentation content is cached for 60 seconds; a signed webhook invalidates it immediately. Drafts bypass caches.
- Supabase remains the authoritative commerce database for checkout, inventory compatibility, orders, payment amounts, and fulfilment. Publishing a CMS product synchronizes its commerce fields in one database transaction before invalidating storefront caches.
- Ready designs remain fixed products. The blank case editor, original image sources, print masks, export pipeline, auth, cart, Razorpay, and manual fulfilment logic remain in code.
- Missing CMS configuration or failed reads retain the existing fallback content. Archiving is supported; destructive product deletion is disabled in Studio.

## Configuration for resuming later

1. Project creation is complete: `nuc0c50h`, dataset `production`. Use this public dataset for public storefront content only. Never put customers, addresses, orders, tokens, or private artwork into Sanity.
2. Add `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` to local and Vercel environment settings.
3. Securely provision `SANITY_API_READ_TOKEN` for server draft preview and `SANITY_API_WRITE_TOKEN` for the one-time import. The runtime publish endpoint reads only published public documents and does not need the write token. Remove the import token from runtime deployment if unnecessary.
4. Generate a strong `SANITY_REVALIDATE_SECRET` and configure it in Vercel and the Sanity webhook. Never prefix private tokens with `NEXT_PUBLIC_`.
5. Keep `SUPABASE_SECRET_KEY` server-only. Apply the additive migration `20261009164319_cms_catalog_publication.sql`; it grants the new publication function only to `service_role`, not browser/customer roles. Existing catalog/order data is preserved.
6. Configure Sanity CORS for `https://caseclan.vercel.app` and `http://localhost:3000`, allowing credentials for Studio sign-in. Restrict trusted origins.
7. Run `npm run cms:import -- --dry-run`, then `npm run cms:import` after reviewing the plan. It reads the current public Supabase catalog, uploads existing media, creates stable IDs, and uses `createIfNotExists`; existing CMS documents are not overwritten. It does not delete Supabase content.
8. Deploy with the Next.js framework preset and default build output, not the old static `out` directory. Server routes are required for secure preview and revalidation. No changes to checkout Edge Functions are needed.

## Signed publish webhook

URL: `https://caseclan.vercel.app/api/cms/revalidate/`

Dataset: the chosen production dataset. Trigger on create/update, excluding drafts. Projection:

```groq
{_id, _type}
```

Filter:

```groq
!(_id in path("drafts.**")) && _type in ["product", "phoneModel", "category", "homepage", "siteSettings", "customizerSettings", "review", "faq", "post", "announcement", "contentPage"]
```

Use the matching webhook secret. Disable drafts/version events. Check deliveries for HTTP 200. HTTP 500 means commerce synchronization failed; retry after fixing the reported validation/configuration error. Publish compatible phone models before products. Use the Archived product status instead of deleting documents.

## Owner workflow

Open Studio, edit content, optionally save a draft and preview via `/content-preview/`, then Publish. New products use `/product/<slug>/`; existing query-style links continue to work. Product compatibility is selected from phone references. New phones require their own accurate base, case overlay, print mask, camera mask, highlights, shadow, and print-area configuration.

## Required live acceptance test

- Publish and restore a harmless homepage text change; verify production without a code redeploy.
- Create a draft product, preview it, publish it with images/models, and verify its exact Supabase price and storefront gallery.
- Edit price/images/flags; confirm server checkout quote uses the published price. Archive the test product; verify it disappears publicly.
- Add a phone configuration and confirm chooser/editor receive its own assets and dimensions.
- Publish SEO/FAQ/blog edits; verify metadata, structured data, optimized images and mobile layouts.
- Verify guest cart persistence, protected checkout and existing customizer uploads/exports. A successful Razorpay capture must be tested separately; previous account test-payment failures are not evidence of success.
- Verify unsigned webhooks and non-admin draft-preview requests are rejected.

## Dependency audit

Compatible dependency fixes were applied. The remaining audit findings are in the installed Sanity/CLI dependency tree; the audit currently recommends breaking major upgrades for them. These require separate compatibility/security review before deployment. Do not run `npm audit fix --force` blindly or claim the dependency audit is clean.

References: [Sanity revalidation](https://www.sanity.io/docs/nextjs/validating-sanity-webhooks-nextjs), [Sanity CORS](https://www.sanity.io/docs/content-lake/cors), [data import](https://www.sanity.io/docs/content-lake/importing-data).
