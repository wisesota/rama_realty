const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getPublicSupabaseEnvironment() {
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  if (!supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured.");
  }

  return {
    url: supabaseUrl,
    publishableKey: supabasePublishableKey,
  };
}
