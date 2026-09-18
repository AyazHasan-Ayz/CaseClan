import type { Metadata } from 'next';
import './globals.css';
import './studio.css';
import StoreProvider from '@/components/StoreProvider';
import Shell from '@/components/Shell';
export const metadata: Metadata = { title: { default: 'CASECLAN — Your Name. Your Case. Your Identity.', template: '%s | CASECLAN' }, description: 'Premium personalized phone covers. Add your name, choose a ready design, or upload your own artwork.', icons: { icon: '/favicon.svg' }, openGraph: { title: 'CASECLAN — Your Name. Your Case. Your Identity.', description: 'Personal stories. Premium covers. Make your flagship case your own.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>; }
