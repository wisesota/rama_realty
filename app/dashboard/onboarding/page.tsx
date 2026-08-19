import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getStaffContext, requireVerifiedUser } from "@/lib/dashboard/dal";

export default async function WorkspaceOnboardingPage() {
  const { email } = await requireVerifiedUser();
  if (await getStaffContext()) redirect("/dashboard");
  return (
    <main className="ops-onboarding">
      <Logo />
      <section><p className="ops-eyebrow">Staff access pending</p><h1>Your identity is verified. Your workspace is not assigned.</h1><p>For security, buyer accounts cannot create staff organizations or grant themselves publishing access. Ask a Rama administrator to invite this account into the correct workspace.</p><Link className="rama-button rama-button--primary" href="/" target="_blank" rel="noopener noreferrer">Open the public site<span className="sr-only"> in a new tab</span></Link><small>Signed in as {email || "verified user"}. No catalog or buyer operations are visible until a membership is provisioned.</small></section>
    </main>
  );
}
