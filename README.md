# CASECLAN

CASECLAN ecommerce storefront built with Next.js 15, React 19, TypeScript and Tailwind/CSS, Supabase commerce/Auth and Razorpay checkout.

## Run

- `npm run dev`: development preview on port 3000.
- `npm test`: personalization and reserved future membership rules.
- `npm run build`: production Next.js build in `.next/`.
- `npm start`: serve the production build on port 3000.
- `npm run check:seo -- http://localhost:3000`: verify SEO against a running build.

## Production domain and hosting

Production runs at `https://caseclan.in` on Netlify. `netlify.toml` sets the
Next.js build/output and production `NEXT_PUBLIC_SITE_URL`; Netlify supplies
its automatic Next.js adapter. Existing public Supabase variables must be
configured for builds and functions in the Netlify dashboard. CMS remains disabled.

Payment and admin catalog mutations use relative `/api/commerce/<action>/`
routes, forwarding the signed-in customer's token to the existing Supabase
Edge Functions. Those functions still enforce user identity, order ownership,
fresh admin roles and payment verification. Supabase Auth/Storage and Razorpay's
SDK remain external service URLs. No service-role or payment secret is needed
in the browser or this proxy.

Supabase Auth must allow the production domain for login, signup and reset
redirects. The Razorpay webhook remains the existing Supabase Edge Function
endpoint; a domain migration does not move it to this website.

## Customer journeys

The homepage uses the supplied lifestyle hero, ten supplied device photographs, style cards, Our Designs, product features, a four-step guide, and a secondary Clan Collections coming-soon teaser.

Routes include `/shop`, `/collections/iphone`, `/collections/samsung`, `/personalized`, `/ready-designs`, `/custom-upload`, `/coming-soon`, `/wishlist`, `/cart`, `/account`, `/search`, `/checkout`, ten device categories and six product details. Existing `/iphone`, `/samsung`, `/clans` and clan paths remain usable.

Ready designs are fixed artwork: choose a compatible phone, then add to cart or buy. The separate customizer starts with a blank case and supports text, images and transforms. Cart and wishlist work for guests; checkout requires Supabase authentication. Search reads the same catalog as the storefront. The read-only WebMCP catalog is retained.

## Assets and data

`data/designs.ts` is the centralized file source, mapped through `lib/designs.ts` and `lib/catalog.ts`. The Supabase catalog supplies published admin products when configured; every storefront section uses the same merged source. The supplied original hero is `public/hero-caseclan-lifestyle.png`; the site serves its optimized WebP derivative. `scripts/prepare-hero.mjs` regenerates that derivative.

Supplied Ayaz photographs illustrate the case; the separate live preview represents the chosen personalization. It is clearly labeled as an illustrative artwork proof, not a manufactured-product photograph.

## Integration boundary

Cart, wishlist and studio drafts persist on the device. Supabase stores authenticated commerce orders and customer data with RLS; server-side functions validate totals and payments. Razorpay remains in Test Mode until separately approved for live sales. Qikink automatic fulfilment is disabled; admins manage fulfilment and tracking manually. Original uploaded artwork is retained separately from the preview for print export. Browser storage has limited capacity, and a visible notice explains persistence failures.

Clan membership is not awarded by launch orders. Existing legacy membership data is preserved but hidden; the pure membership rules remain reserved for a future release. Archived product orders render safely.

Before live payments, complete gateway/account approval and production acceptance testing. Validate fulfilment print specifications and transactional messaging separately. See `docs/production-domain-migration.md` for applied production configuration and verification limits.

## September 2026 customization studio

`/customize/` provides device selection, basic setup, a premium canvas-based 2.5D mockup editor and final preview. `/custom-upload/` enters the image-upload journey. Text and image layers support movement, sizing, rotation, ordering and undo/redo. The editor saves drafts in IndexedDB and attaches an artifact ID to cart/order selections. `DesignFiles` retrieves separate 2048 × 4096 flat print PNG and customization JSON downloads. Customer preview screenshots are separate from print artwork.

`lib/customizer.ts` owns templates, device-specific camera masks, safe-area rules and persistence. `CaseScene.tsx` renders artwork into realistic per-device 2.5D product templates with studio lighting, transparent edge depth and preset viewing angles. Final print placement still needs validation against Qikink's fulfillment templates. `lib/assets.ts` centralizes supplied September photographs and the optional original logo slot. See `VALIDATION.md` for tested flows and production integration boundaries.
