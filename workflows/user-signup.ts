"use workflow";

import { sleep } from "workflow";
import { createUser, sendWelcomeEmail, sendOnboardingEmail } from "./steps";

export async function handleUserSignup(email: string) {
  const user = await createUser(email);

  await sendWelcomeEmail(user.id);

  // Wait for 3 days before sending the onboarding email
  await sleep("3 days");

  await sendOnboardingEmail(user.id);
}
