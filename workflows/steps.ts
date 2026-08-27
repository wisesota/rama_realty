"use step";

export async function createUser(email: string) {
  // In a real app, you would save the user to a database here
  console.log(`[Workflow Step] User created with email: ${email}`);
  return { id: "user_" + Math.random().toString(36).substring(7) };
}

export async function sendWelcomeEmail(userId: string) {
  console.log(`[Workflow Step] Sending welcome email to user: ${userId}`);
}

export async function sendOnboardingEmail(userId: string) {
  console.log(`[Workflow Step] Sending onboarding email to user: ${userId}`);
}
