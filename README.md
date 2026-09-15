# CASECLAN

A responsive Next.js 15 / React 19 / TypeScript storefront, styled with Tailwind CSS 4 and editorial CSS. Built against the supplied CASECLAN reference.

## Run

```sh
npm ci
npm run dev -- --port 3001
npm test
npm run build
```

`npm run build` creates a deployable static site in `out/`. `npm start` serves the static production build on port 3001 (or the PORT environment variable). The development server works with `npm run dev`.

## Included

- Homepage with campaign, device carousel, four clans, carbon drop, product grid, features, membership, sample review layout and footer.
- Eight product pages, eight device collections, four clan collections and general shop routes.
- Clan, style, material, colour, MagSafe and price filters; sorting; search; product galleries and device selection.
- Wishlist, quantity-controlled bag, demo checkout, post-purchase welcome, local orders, profile and address.
- Permanent Primary Clan, collectible badges and Elite membership.
- Supporting device guide, FAQs, returns, contact preview, order lookup and privacy pages.
- Native accessible dialogs, keyboard focus management, semantic landmarks, reduced-motion support and responsive layouts.
- Route metadata, Open Graph text, favicon and product JSON-LD without fabricated aggregate ratings or offers.

## Data and assets

Edit `lib/catalog.ts` for devices, products, prices, clan identities and central asset mapping. Optimized imagery is under `public/images/`. Image-generation source and brief details are documented in `ASSETS.md`.

`lib/membership.ts` is a pure domain function. A successful payment event awards clans once per order ID, preserves the original membership number and year, and never replaces the primary identity. Tests cover first purchase, repeat purchases, pending/failed payment, repeated events, mixed-clan orders and Elite status.

`components/StoreProvider.tsx` is the browser-local demo adapter. It stores versioned state under `caseclan-store-v1`. Clearing browser data removes the demo profile, orders, bag, wishlist and membership. The `ready` flag identifies when browser state has loaded. Information is not synced between devices.

## Production integration boundary

This deliverable is a complete **frontend preview**, not a payment or fulfilment service. Checkout explicitly simulates a successful payment; it never collects card details or charges money. Newsletter and contact UI explicitly explain that messages are not delivered.

For launch, replace the demo adapter with authenticated API calls. Verify payment-provider webhook signatures on a trusted server, look up product clans and prices from the database, and apply membership inside an idempotent transaction with a unique order constraint. Never award production membership from a browser-supplied `paid` status. Generate globally unique membership numbers on the server. Retain the pure membership rules and tests.

Configure actual inventory and device fit, payment provider, shipping, returns, email delivery, customer authentication, legal terms and real social destinations before accepting real orders. Concept photography and sample ratings/reviews are labeled; replace them with verified product assets and genuine reviews. Promotional material and performance specifications require validation against actual products.

## Mixed-clan rule

For the first paid order containing several clans, the first bag item's clan becomes Primary Clan. Every distinct purchased clan is collected. Later orders add badges without replacing the primary clan. All four clans unlock CASECLAN ELITE.

## Agent-readable catalog

When supported, the page registers `search_caseclan_catalog` through WebMCP as a read-only catalog tool. It cannot place orders.

"# CaseClan" 
