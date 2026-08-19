import { getAuthenticatedSupabase, isSameOrigin } from "@/lib/supabase/auth";

type SearchBriefRequest = {
  brief?: unknown;
  criteria?: unknown;
  source?: unknown;
  resultIds?: unknown;
};

function cleanStringList(value: unknown, maximumItems: number) {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const strings = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return strings.length === value.length ? strings : null;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Cross-origin save requests are not allowed." }, { status: 403 });
  }

  const { supabase, userId } = await getAuthenticatedSupabase();
  if (!userId) {
    return Response.json({ error: "Sign in to save this property brief." }, { status: 401 });
  }

  let body: SearchBriefRequest;
  try {
    body = (await request.json()) as SearchBriefRequest;
  } catch {
    return Response.json({ error: "The saved brief must be valid JSON." }, { status: 400 });
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const criteria = cleanStringList(body.criteria, 10);
  const resultIds = cleanStringList(body.resultIds, 20);
  const source = body.source === "voice" ? "voice" : body.source === "text" ? "text" : null;

  if (brief.length < 3 || brief.length > 500 || !criteria || !resultIds || !source) {
    return Response.json({ error: "The property brief is incomplete or too long." }, { status: 400 });
  }

  const { error } = await supabase.from("search_briefs").insert({
    user_id: userId,
    brief,
    criteria,
    source,
    result_ids: resultIds,
  });

  if (error) {
    return Response.json(
      { error: "The property brief could not be saved." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { saved: true },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
