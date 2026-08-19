export async function POST() {
  return Response.json(
    {
      error: "This legacy search endpoint has been retired. Use the governed Decision Room discovery contract.",
      code: "EndpointRetired",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
