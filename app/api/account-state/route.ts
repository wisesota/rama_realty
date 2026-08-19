import { getAuthenticatedSupabase } from "@/lib/supabase/auth";

export async function GET() {
  try {
    const { supabase, userId } = await getAuthenticatedSupabase();
    if (!userId) {
      return Response.json(
        { authenticated: false, savedBriefCount: 0, favoriteIds: [] },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [briefs, shortlist] = await Promise.all([
      supabase
        .from("search_briefs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("shortlist_items")
        .select("property_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (briefs.error || shortlist.error) {
      return Response.json(
        { error: "Saved search storage is not ready for this environment." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        authenticated: true,
        savedBriefCount: briefs.count ?? 0,
        favoriteIds: shortlist.data.map((item) => item.property_id),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Supabase is not available in this environment." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
