import { createAdminClient } from "@/lib/supabase/admin";

export async function createUser(email: string) {
  "use step";
  const redactedEmail = email.replace(/(?<=^.{2}).*(?=@)/, '***');
  console.log(`[Workflow Step] User created with email: ${redactedEmail}`);
  
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
  });
  
  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
  
  return { id: data.user.id };
}

export async function sendWelcomeEmail(userId: string) {
  "use step";
  console.log(`[Workflow Step] Sending welcome email to user: ${userId}`);
  
  const admin = createAdminClient();
  const { data: user, error } = await admin.auth.admin.getUserById(userId);
  if (error || !user.user.email) {
    throw new Error(`Failed to retrieve user email: ${error?.message}`);
  }
  
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rama Realty <hello@ramarealty.com>",
        to: user.user.email,
        subject: "Welcome to Rama Realty",
        html: "<p>Thank you for joining Rama Realty. Your Dubai property journey begins here.</p>",
      }),
    });
  }
}

export async function sendOnboardingEmail(userId: string) {
  "use step";
  console.log(`[Workflow Step] Sending onboarding email to user: ${userId}`);
  
  const admin = createAdminClient();
  const { data: user, error } = await admin.auth.admin.getUserById(userId);
  if (error || !user.user.email) {
    throw new Error(`Failed to retrieve user email: ${error?.message}`);
  }
  
  if (process.env.RESEND_API_KEY) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rama Realty <hello@ramarealty.com>",
        to: user.user.email,
        subject: "Find Your Perfect Home",
        html: "<p>Ready to discover your next Dubai property? Speak with our advisors today.</p>",
      }),
    });
  }
}
