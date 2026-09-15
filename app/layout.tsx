import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/components/StoreProvider';
import Shell from '@/components/Shell';
export const metadata: Metadata = { title: { default: 'CASECLAN — You Choose a Clan', template: '%s | CASECLAN' }, description: 'Premium cases for flagship phones. Discover NOIR, VALOR, SAGE and AURA. People. Phones. Clans.', icons: { icon: '/favicon.svg' }, openGraph: { title: 'CASECLAN — You Choose a Clan', description: 'Premium cases. Four original clans. Find your identity.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>; }
