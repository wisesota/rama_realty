import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const commitPattern = /^[a-f0-9]{40}$/;
const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const releaseCommit = process.env.RAMA_RELEASE_COMMIT?.trim();
  if (!releaseCommit || !commitPattern.test(releaseCommit)) {
    return NextResponse.json(
      { status: "unconfigured" },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    { status: "ok", releaseCommit },
    { headers: noStoreHeaders },
  );
}
