# CASECLAN production domain migration — 13 October 2026

## Applied

- Netlify production deploy `89e3f60`, deploy ID `6acdd0e49de1902209e8dea0`, published at `https://caseclan.in`.
- Added production-only Netlify variables: `NEXT_PUBLIC_SITE_URL`, existing `NEXT_PUBLIC_SUPABASE_URL`, existing `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_CMS_ENABLED=false`. No private keys were copied to the browser or committed.
- Added `netlify.toml`: `npm run build`, `.next`, Node 22, production origin. Netlify's automatic Next.js Runtime deployed successfully.
- SEO defaults and all generated canonical, Open Graph, sitemap, robots and schema URLs now use `caseclan.in` through `lib/seo/config.ts`.
- Payment/COD session creation, verification, status and admin catalog saves now use relative `/api/commerce/<action>/` calls. The allowlisted proxy forwards the customer's JWT and public API key to the existing Edge Functions. It never substitutes a privileged token. Existing order ownership, captured-payment verification, fresh database admin-role checks and RLS remain in place.
- Supabase Auth Site URL saved as `https://caseclan.in`. Added primary/www wildcard redirects while retaining the previous exact/development/legacy entries.
- Remote `CASECLAN_ALLOWED_ORIGINS` now includes primary/www domains plus the retained Vercel, ChatGPT Sites and localhost development origins. Existing Razorpay credentials were unchanged.
- Setup examples, payment/CMS documentation and SEO verification script updated. Sanity remains paused.
- Guarded the existing customizer's price display when the remote custom-case product is absent/archived. This keeps editing available without inventing a purchasable product, price, or changing catalog status.

## Verified

- All 70 automated tests passed; production build passed TypeScript checks.
- Local and live SEO checks: six canonical pages, valid JSON-LD, sitemap, robots and private-page noindex rules.
- Live same-origin proxy: guests rejected, arbitrary actions rejected, cross-site Origin rejected; invalid tokens were forwarded and rejected by upstream authentication without changing data.
- All four Edge Functions return correct CORS responses for both new domains (eight OPTIONS checks).
- `www.caseclan.in` returns HTTP 301 to `https://caseclan.in/`.
- Google OAuth initially fell back to the old Vercel Site URL. After correcting Supabase settings, login returned to `/checkout/` with a valid session and the same cart/model. Repeated successfully at actual 390px and 1440px viewports.
- Logout returns to login; guest checkout requires authentication. The owner account can open `/admin/` and `/admin/products/`; the latter reports ten products from Supabase, including two currently active designs.
- The newly added F1 Racing design appears beside Mercedes on mobile homepage at 320/375/390/430px without horizontal overflow. Desktop and mobile read the same catalog. Shop and Ready Designs show the same two active remote designs; search finds F1; its dynamic product route, model selector, wishlist and guest cart work.
- Owner-reported manual production verification: login, cart, checkout, COD, Razorpay Test Mode flow, order-success and mobile/desktop pages work. These payment/order results are user verification, not an agent-observed captured-payment or webhook test.

## Service endpoints intentionally retained

- Google provider callback: `https://ftjucooznvhpdcjsfngr.supabase.co/auth/v1/callback`.
- Razorpay webhook: `https://ftjucooznvhpdcjsfngr.supabase.co/functions/v1/razorpay-webhook`.
- Supabase Auth/database/storage and Razorpay SDK/provider URLs remain their service URLs. Historical audit evidence and old test fixtures are not production frontend destinations.
- Legacy Auth/CORS entries remain because the older deployments still exist; remove them only when those deployments are retired.

## Remaining verification and content notes

- Owner confirmed the production payment/COD and order-success flows manually and requested only remaining cleanup/documentation. No additional orders were created by the agent. A captured-payment/webhook event was not independently inspected during this migration.
- One MutationObserver console error was observed during SPA navigation. No corresponding MutationObserver exists in application source; the source of this injected/runtime error remains unconfirmed. Do not describe the entire production console as error-free.
- Flagged existing Mercedes and F1/formula-racing product names/artwork references for the owner's licensing/content review. No product names or artwork were changed.
- Existing unrelated local purchase-CTA changes remain uncommitted and were not included in this domain deployment.
