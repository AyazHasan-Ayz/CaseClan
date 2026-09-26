import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const root=process.cwd(),out=join(root,'out');
const required=['sitemap.xml','robots.txt','sitemap/index.html'];
for(const file of required)if(!existsSync(join(out,file)))throw new Error(`Missing SEO export: ${file}`);

const sitemap=readFileSync(join(out,'sitemap.xml'),'utf8');
const blocked=['/admin','/account/','/login/','/checkout/','/cart/','/wishlist/','/order-success/','/search/','/track-order/'];
for(const path of blocked)if(sitemap.includes(path))throw new Error(`Private route found in sitemap: ${path}`);

const canonicalPages=['index.html','shop/index.html','faq/index.html','about/index.html','product/minimal-name/index.html','iphone-17-cases/index.html'];
for(const file of canonicalPages){const html=readFileSync(join(out,file),'utf8');if(!/<link rel="canonical" href="https:\/\/caseclan\.ayazbhai787\.chatgpt\.site\//.test(html))throw new Error(`Canonical missing: ${file}`)}

for(const file of ['cart/index.html','checkout/index.html','account/index.html','login/index.html','wishlist/index.html','search/index.html','track-order/index.html','order-success/order/index.html']){
  const html=readFileSync(join(out,file),'utf8');if(!/<meta name="robots" content="noindex, nofollow/.test(html))throw new Error(`Noindex missing: ${file}`);
}

for(const file of ['index.html','faq/index.html','about/index.html','contact/index.html','product/minimal-name/index.html','iphone-17-cases/index.html']){
  const html=readFileSync(join(out,file),'utf8');const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if(!scripts.length)throw new Error(`JSON-LD missing: ${file}`);for(const match of scripts)JSON.parse(match[1]);
}
console.log(JSON.stringify({sitemap:true,robots:true,canonicals:canonicalPages.length,noindex:8,jsonLd:'valid'},null,2));
