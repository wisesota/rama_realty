import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const commitPattern = /^[a-f0-9]{40}$/;
const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const releaseCommit = process.env.RAMA_RELEASE_COMMIT?.trim();
  const deploymentCommit = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (
    !releaseCommit ||
    !deploymentCommit ||
    !commitPattern.test(releaseCommit) ||
    !commitPattern.test(deploymentCommit)
  ) {
    return NextResponse.json(
      { status: "unconfigured" },
      { status: 503, headers: noStoreHeaders },
    );
  }

  if (releaseCommit !== deploymentCommit) {
    return NextResponse.json(
      { status: "mismatch" },
      { status: 503, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(
    { status: "ok", releaseCommit },
    { headers: noStoreHeaders },
  );
}
