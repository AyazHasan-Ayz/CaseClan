import type { NextConfig } from 'next';
const config: NextConfig = { devIndicators: false, images: { remotePatterns:[{protocol:'https',hostname:'cdn.sanity.io'},{protocol:'https',hostname:'ftjucooznvhpdcjsfngr.supabase.co'}] }, trailingSlash: true };
export default config;


