import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];
const credentialKeys = [
  "RAMA_RLS_TEST_USER_A_EMAIL",
  "RAMA_RLS_TEST_USER_A_PASSWORD",
  "RAMA_RLS_TEST_USER_B_EMAIL",
  "RAMA_RLS_TEST_USER_B_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Hosted two-user RLS verification requires: ${missing.join(", ")}.`);
  process.exit(1);
}

const useEphemeralIdentities = process.env.RAMA_RLS_TEST_EPHEMERAL === "true";
const missingCredentials = credentialKeys.filter((key) => !process.env[key]?.trim());
if (missingCredentials.length && !useEphemeralIdentities) {
  console.error(
    `Hosted two-user RLS verification requires: ${missingCredentials.join(", ")}, ` +
      "or RAMA_RLS_TEST_EPHEMERAL=true for disposable development identities.",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const marker = `hosted-rls-${randomUUID()}`;
const createdIds = [];
const createdIdentityIds = [];

function client(key) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: {
      fetch: (input, init = {}) => fetch(input, {
        ...init,
        signal: AbortSignal.timeout(15_000),
      }),
    },
  });
}

const userA = client(publishableKey);
const userB = client(publishableKey);
const admin = client(secretKey);

async function signIn(supabase, credentials, label) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error || !data.user) throw new Error(`Hosted RLS test sign-in failed for ${label}.`);
  return data.user.id;
}

async function provisionEphemeralIdentity(label) {
  const credentials = {
    email: `rama-rls-${label}-${randomUUID()}@example.com`,
    password: randomBytes(32).toString("base64url"),
  };
  const { data, error } = await admin.auth.admin.createUser({
    ...credentials,
    email_confirm: true,
    user_metadata: { purpose: "rama-rls-verification" },
  });
  if (error || !data.user) throw new Error(`Hosted RLS test identity provisioning failed for ${label}.`);
  createdIdentityIds.push(data.user.id);
  return credentials;
}

async function insertOwnedBrief(supabase, userId, label) {
  const { data, error } = await supabase.from("search_briefs")
    .insert({ user_id: userId, brief: `${marker}-${label}`, criteria: [marker], source: "text" })
    .select("id,user_id")
    .single();
  if (error || !data?.id || data.user_id !== userId) throw new Error(`Hosted RLS owner insert failed for ${label}.`);
  createdIds.push(data.id);
  return data.id;
}

async function assertOwnRead(supabase, id, userId, label) {
  const { data, error } = await supabase.from("search_briefs").select("id,user_id").eq("id", id);
  if (error || data?.length !== 1 || data[0].user_id !== userId) throw new Error(`Hosted RLS owner read failed for ${label}.`);
}

async function assertCrossOwnerDenied(supabase, id, label) {
  const { data, error } = await supabase.from("search_briefs").select("id,user_id").eq("id", id);
  if (error || !Array.isArray(data) || data.length !== 0) throw new Error(`Hosted RLS cross-owner read was not denied for ${label}.`);
}

async function main() {
  const credentialsA = useEphemeralIdentities
    ? await provisionEphemeralIdentity("a")
    : {
        email: process.env.RAMA_RLS_TEST_USER_A_EMAIL,
        password: process.env.RAMA_RLS_TEST_USER_A_PASSWORD,
      };
  const credentialsB = useEphemeralIdentities
    ? await provisionEphemeralIdentity("b")
    : {
        email: process.env.RAMA_RLS_TEST_USER_B_EMAIL,
        password: process.env.RAMA_RLS_TEST_USER_B_PASSWORD,
      };
  const userAId = await signIn(userA, credentialsA, "user-a");
  const userBId = await signIn(userB, credentialsB, "user-b");
  if (userAId === userBId) throw new Error("Hosted RLS verification requires two distinct Auth users.");

  const briefA = await insertOwnedBrief(userA, userAId, "user-a");
  const briefB = await insertOwnedBrief(userB, userBId, "user-b");
  await Promise.all([
    assertOwnRead(userA, briefA, userAId, "user-a"),
    assertOwnRead(userB, briefB, userBId, "user-b"),
    assertCrossOwnerDenied(userA, briefB, "user-a-to-user-b"),
    assertCrossOwnerDenied(userB, briefA, "user-b-to-user-a"),
  ]);

  const crossOwnerId = randomUUID();
  createdIds.push(crossOwnerId);
  const crossInsert = await userA.from("search_briefs")
    .insert({ id: crossOwnerId, user_id: userBId, brief: `${marker}-cross-owner`, criteria: [marker], source: "text" });
  if (!crossInsert.error) throw new Error("Hosted RLS cross-owner insert was unexpectedly accepted.");

  console.log(JSON.stringify({
    ok: true,
    distinctAuthenticatedUsers: true,
    ownerInsertAndRead: true,
    crossOwnerReadDenied: true,
    crossOwnerInsertDenied: true,
    ephemeralIdentities: useEphemeralIdentities,
    temporaryRowsCreated: createdIds.length,
  }));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Hosted two-user RLS verification failed.");
  process.exitCode = 1;
} finally {
  if (createdIds.length) {
    const { error } = await admin.from("search_briefs").delete().in("id", createdIds);
    if (error) {
      console.error("Hosted RLS verification cleanup failed; remove rows carrying the generated hosted-rls marker.");
      process.exitCode = 1;
    }
  }
  await Promise.allSettled([userA.auth.signOut({ scope: "local" }), userB.auth.signOut({ scope: "local" })]);
  if (createdIdentityIds.length) {
    const results = await Promise.allSettled(
      createdIdentityIds.map((id) => admin.auth.admin.deleteUser(id)),
    );
    if (results.some((result) => result.status === "rejected" || result.value.error)) {
      console.error("Hosted RLS verification identity cleanup failed; remove users marked rama-rls-verification.");
      process.exitCode = 1;
    }
  }
}
