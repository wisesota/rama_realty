import { getAuthenticatedSupabase, isSameOrigin } from "@/lib/supabase/auth";

function validPropertyId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{3,80}$/.test(value);
}

async function readPropertyId(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return null;
    const propertyId = (body as { propertyId?: unknown }).propertyId;
    return validPropertyId(propertyId) ? propertyId : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-origin shortlist requests are not allowed." }, { status: 403 });
  }
  const { supabase, userId } = await getAuthenticatedSupabase();
  if (!userId) return Response.json({ error: "Sign in to save a shortlist." }, { status: 401 });

  const propertyId = await readPropertyId(request);
  if (!propertyId) return Response.json({ error: "A valid property is required." }, { status: 400 });

  const { error } = await supabase
    .from("shortlist_items")
    .upsert({ user_id: userId, property_id: propertyId }, { onConflict: "user_id,property_id" });

  if (error) return Response.json({ error: "The shortlist could not be updated." }, { status: 503 });
  return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-origin shortlist requests are not allowed." }, { status: 403 });
  }
  const { supabase, userId } = await getAuthenticatedSupabase();
  if (!userId) return Response.json({ error: "Sign in to save a shortlist." }, { status: 401 });

  const propertyId = await readPropertyId(request);
  if (!propertyId) return Response.json({ error: "A valid property is required." }, { status: 400 });

  const { error } = await supabase
    .from("shortlist_items")
    .delete()
    .eq("user_id", userId)
    .eq("property_id", propertyId);

  if (error) return Response.json({ error: "The shortlist could not be updated." }, { status: 503 });
  return Response.json({ saved: false }, { headers: { "Cache-Control": "no-store" } });
}
