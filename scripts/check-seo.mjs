// Check a running local build or the deployed site, including dynamic routes.
const origin=(process.argv[2]||process.env.NEXT_PUBLIC_SITE_URL||'https://caseclan.in').replace(/\/$/,'');
const canonicalOrigin=(process.env.NEXT_PUBLIC_SITE_URL||'https://caseclan.in').replace(/\/$/,'');
const get=async(path)=>{const response=await fetch(`${origin}${path}`);if(!response.ok)throw Error(`${path}: HTTP ${response.status}`);return response.text()};
const sitemap=await get('/sitemap.xml');
for(const path of ['/admin','/account/','/login/','/checkout/','/cart/','/wishlist/','/order-success/','/search/','/track-order/'])if(sitemap.includes(path))throw Error(`Private route in sitemap: ${path}`);
if(sitemap.includes('caseclan.vercel.app')||sitemap.includes('caseclan.ayazbhai787.chatgpt.site'))throw Error('Old domain in sitemap');
const product=[...sitemap.matchAll(/<loc>([^<]+\/product\/[^<]+)<\/loc>/g)][0]?.[1];
if(!product)throw Error('No product routes in sitemap');
const pages=['/','/shop/','/faq/','/about/',new URL(product).pathname,'/iphone-17-cases/'];
for(const path of pages){const html=await get(path);if(!html.includes(`<link rel="canonical" href="${canonicalOrigin}${path}"`))throw Error(`Incorrect canonical: ${path}`);const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];for(const match of scripts)JSON.parse(match[1]);if(!scripts.length)throw Error(`JSON-LD missing: ${path}`)}
const robots=await get('/robots.txt');if(!robots.includes(`${canonicalOrigin}/sitemap.xml`))throw Error('Incorrect robots sitemap origin');
for(const path of ['/cart/','/checkout/','/account/','/login/','/wishlist/','/search/','/track-order/']){const html=await get(path);if(!/<meta name="robots" content="noindex, nofollow/.test(html))throw Error(`Noindex missing: ${path}`)}
console.log(JSON.stringify({origin,sitemap:true,robots:true,canonicalPages:pages.length,jsonLd:true,noindex:true},null,2));
