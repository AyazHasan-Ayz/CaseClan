import type { Metadata } from 'next';
import './globals.css';
import './studio.css';
import StoreProvider from '@/components/StoreProvider';
import Shell from '@/components/Shell';
export const metadata: Metadata = { title: { default: 'CASECLAN — Premium Phone Cases', template: '%s | CASECLAN' }, description: 'Shop fixed CASECLAN artwork or choose your phone and create a custom case from a blank canvas.', icons: { icon: '/favicon.svg' }, openGraph: { title: 'CASECLAN — Premium Phone Cases', description: 'Ready designs and a blank custom case studio for flagship phones.', type: 'website' } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>; }
