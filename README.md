# CASECLAN

Premium personalized-cover frontend built with the existing Next.js 15, React 19, TypeScript and Tailwind/CSS architecture.

## Run

- `npm run dev`: development preview on port 3000.
- `npm test`: personalization and reserved future membership rules.
- `npm run build`: production static export in `out/`.
- `npm start`: serve the export on port 3001.

## Customer journeys

The homepage uses the supplied lifestyle hero, ten supplied device photographs, style cards, Our Designs, product features, a four-step guide, and a secondary Clan Collections coming-soon teaser.

Routes include `/shop`, `/collections/iphone`, `/collections/samsung`, `/personalized`, `/ready-designs`, `/custom-upload`, `/coming-soon`, `/wishlist`, `/cart`, `/account`, `/search`, `/checkout`, ten device categories and six product details. Existing `/iphone`, `/samsung`, `/clans` and clan paths remain usable.

Customers can choose a device, name, font, text color and style; preview a digital artwork proof; upload an image with print instructions; save favourites; configure a case through quick-add; manage cart quantities; and complete a local demo checkout. Search works by product, device and style. The read-only WebMCP catalog is retained.

## Assets and data

`lib/catalog.ts` centralizes products, device compatibility and asset mappings. The supplied original hero is `public/hero-caseclan-lifestyle.png`; the site serves its optimized WebP derivative. `scripts/prepare-hero.mjs` regenerates that derivative.

Supplied Ayaz photographs illustrate the case; the separate live preview represents the chosen personalization. It is clearly labeled as an illustrative artwork proof, not a manufactured-product photograph.

## Integration boundary

This is a complete frontend preview. Cart, wishlist, uploaded preview image, order, profile and mailing-list preference are stored in this browser under `caseclan-store-v1`. No real payments, manufacturing orders, emails or support messages are sent. Artwork is resized locally before preview storage. Browser storage has limited capacity, and a visible notice explains any persistence failure.

Clan membership is not awarded by launch orders. Existing legacy membership data is preserved but hidden; the pure membership rules remain reserved for a future release. Archived product orders render safely.

Before real sales, connect authenticated account APIs, authoritative product prices and inventory, a payment gateway, original artwork storage and review, fulfilment, and transactional messaging. Publish verified specifications, final personalized-return terms and genuine customer reviews.

## September 2026 customization studio

`/customize/` provides device selection, basic setup, a premium canvas-based 2.5D mockup editor and final preview. `/custom-upload/` enters the image-upload journey. Text and image layers support movement, sizing, rotation, ordering and undo/redo. The editor saves drafts in IndexedDB and attaches an artifact ID to cart/order selections. `DesignFiles` retrieves separate 2048 × 4096 flat print PNG and customization JSON downloads. Customer preview screenshots are separate from print artwork.

`lib/customizer.ts` owns templates, device-specific camera masks, safe-area rules and persistence. `CaseScene.tsx` renders artwork into realistic per-device 2.5D product templates with studio lighting, transparent edge depth and preset viewing angles. Final print placement still needs validation against Qikink's fulfillment templates. `lib/assets.ts` centralizes supplied September photographs and the optional original logo slot. See `VALIDATION.md` for tested flows and production integration boundaries.
