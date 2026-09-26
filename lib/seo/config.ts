export const siteConfig = {
  name: 'CASECLAN',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://caseclan.ayazbhai787.chatgpt.site').replace(/\/$/, ''),
  defaultImage: '/images/hero-caseclan-lifestyle.webp',
  description: 'Premium ready-design phone cases and a blank studio for creating your own custom case.',
  currency: 'INR',
} as const;

export function absoluteUrl(path = '/') {
  return new URL(path, `${siteConfig.url}/`).toString();
}
