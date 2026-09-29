const requireValue = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export function getSupabasePublicEnv() {
  return {
    url: requireValue('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    publishableKey: requireValue(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
