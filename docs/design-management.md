# CASECLAN design management

## Add a design once

Put the images in `public/assets/designs/`, then add one object to `data/designs.ts`:

```ts
{
 id: 'midnight-discipline',
 name: 'Midnight Discipline',
 slug: 'midnight-discipline',
 shortDescription: 'Discipline over mood.',
 price: 599,
 images: ['/assets/designs/midnight-discipline-1.webp'],
 category: 'Grunge',
 tags: ['Dark', 'Motivational'],
 compatiblePhones: ['iPhone 17', 'iPhone 16 Pro'],
 featured: true,
 bestSeller: false,
 active: true,
 createdAt: '2026-10-12T00:00:00.000Z',
}
```

Rebuild/deploy code changes as usual. No Sanity setup or additional component edits are needed. The homepage shows all active designs newest first; Best Sellers and Featured use their respective flags. Shop, search, model compatibility, gallery, slug routes and sitemap use the same normalized catalog. `id` stays stable for cart/order references; `slug` determines `/product/<slug>/`.

## Existing commerce remains intact

The `managedRemotely` marker on existing designs preserves the current admin database product prices, availability, images and phone variants. Those records retain their existing publication/unpublication behavior. Do not add this marker to a new file design: it would hide it until its database record exists. Unmarked file designs remain in the shared catalog across cached/remote refreshes, and their `active` flag controls their visibility.

The central file is also the complete offline fallback. A failed database read does not remove the file catalog. Existing imported image URLs remain unchanged; for new designs, local images make the display independent of cloud storage.

Real checkout still uses server-validated Supabase product IDs/prices. Before selling a newly added file design, register the same stable ID/slug, price and phone variants through the existing admin product flow. A displayed file design alone does not create a database payment product; checkout security is not bypassed and no database writes occur during this refactor.

## Future data source

`lib/designs.ts` is the catalog adapter and contains reusable active/newest/featured/best-seller/search/slug selectors. Existing database adapters normalize into the same `Product` interface and call `resolveDesignCatalog`. Frontend components consume the shared store snapshot, never maintain their own product lists. A future admin/database migration can replace the file loader at this boundary without rewriting cards, galleries, search or listing components. CMS remains paused.

## Verification — 2026-10-12

- 67 automated tests passed, including a new design with different ID/slug, tags, phone-name normalization, newest ordering, inactive filtering and persistence across database refreshes.
- TypeScript check and production build passed (117 generated pages). The first sandbox build hit a Windows output-directory permission error; the subsequent build completed successfully.
- Local production browser checks verified six published designs on homepage/listing, newest ordering, Mercedes pricing at INR 599 with six gallery images, search, guest cart persistence and redirect to login before checkout.
- Listing widths 320, 390 and 430 had no horizontal overflow. The customizer loaded, added a text layer, and deleted it back to a blank case. No captured console errors; no payment or order was submitted.
- CMS remains disabled. No database data was changed or deployment performed for this refactor. Existing active catalog entries, including the prior catalog verification entry, were preserved as requested.

## Mobile homepage correction — 2026-10-12

`studio.css` overrode the shared mobile layout with five fixed 170px columns and horizontal overflow. Designs beyond the first five created an implicit second row, so only a subset appeared in the visible strip. Another mobile rule hid the last Featured/Best Seller card. Both rules were corrected: Our Designs now wraps every shared catalog item into two columns, and no last-card hiding remains. Captions use normal flow within a flexible-height card, preserving full names and descriptions.

A temporary active design was added once to `data/designs.ts` and included in a production build. Browser verification at 320, 375, 390 and 430 pixels confirmed:

- New design first, with identical seven-design order at every mobile width and desktop.
- All card bounds within the viewport; no grid/page horizontal overflow; captions inside card bounds.
- Newly added design visible in the mobile screenshot, All Designs, search and its generated product route.
- No captured console errors; 67 automated tests passed.

Evidence: `qa/mobile-design-visibility-results.json` and `qa/mobile-design-{320,375,390,430}.jpg`. The temporary design was then removed, and the final catalog rebuilt. No live deployment or database changes were made.
