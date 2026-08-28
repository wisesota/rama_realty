export function getPublicSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.");
  }

  return {
    url,
    publishableKey,
  };
}
