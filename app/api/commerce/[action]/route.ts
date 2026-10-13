import {proxyCommerce} from '@/lib/commerce-proxy';

export const runtime = 'nodejs';
export async function POST(request: Request, context: {params: Promise<{action: string}>}) {
  const {action} = await context.params;
  return proxyCommerce(request, action, {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
