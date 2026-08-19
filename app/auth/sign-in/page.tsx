import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/logo";
import { getStaffContext, getVerifiedUser } from "@/lib/dashboard/dal";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import "./sign-in.css";

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams;
  const nextPath = safeInternalPath(next);
  const verified = await getVerifiedUser();
  if (verified.userId) {
    const staff = await getStaffContext();
    redirect(staff ? (nextPath || "/dashboard") : "/dashboard/onboarding");
  }

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="sign-in-title">
        <Link href="/" aria-label="Return to Rama Realty">
          <Logo />
        </Link>
        <div>
          <p className="auth-eyebrow">Rama operations desk</p>
          <h1 id="sign-in-title">A controlled path from inventory to answer.</h1>
          <p>
            Administrators manage source freshness, publication, payment plans, and
            buyer handoffs here. Every public answer remains traceable to governed data.
          </p>
        </div>
        <dl className="auth-assurances">
          <div><dt>Access</dt><dd>Organization and role scoped</dd></div>
          <div><dt>Publishing</dt><dd>Draft, review, publish</dd></div>
          <div><dt>Audit</dt><dd>Actor and change recorded</dd></div>
        </dl>
      </section>

      <section className="auth-form-wrap" aria-label="Administrator sign in">
        <div className="auth-form-heading">
          <p>Administrator access</p>
          <h2>Sign in to the CRM</h2>
        </div>
        <SignInForm nextPath={nextPath} />
        <p className="auth-legal">
          Access is restricted to authorized Rama Realty administrators. Activity
          may be logged for security and audit purposes.
        </p>
      </section>
    </main>
  );
}
