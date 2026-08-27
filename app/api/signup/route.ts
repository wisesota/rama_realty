import { start } from "workflow/api";
import { handleUserSignup } from "@/workflows/user-signup";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = body as { email?: unknown };
  if (typeof email !== "string" || email.trim() === "") {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  // Executes asynchronously and doesn't block your app
  await start(handleUserSignup, [email.trim()]);

  return NextResponse.json({
    message: "User signup workflow started",
  });
}
