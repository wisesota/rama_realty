import { createAdminClient } from "@/lib/supabase/admin";

export async function createUser(email: string) {
  "use step";
  const redactedEmail = email.replace(/(?<=^.{2}).*(?=@)/, '***');
  console.log(`[Workflow Step] User created with email: ${redactedEmail}`);
  
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  
  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
  
  return { id: data.user.id };
}

export async function sendWelcomeEmail(userId: string) {
  "use step";
  console.log(`[Workflow Step] Sending welcome email to user: ${userId}`);
  // In a real implementation with Resend/SendGrid, this would dispatch the email.
}

export async function sendOnboardingEmail(userId: string) {
  "use step";
  console.log(`[Workflow Step] Sending onboarding email to user: ${userId}`);
  // In a real implementation with Resend/SendGrid, this would dispatch the email.
}
