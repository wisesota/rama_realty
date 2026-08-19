export const supportedTimezones = [
  "Asia/Dubai",
  "Etc/UTC",
  "Europe/London",
  "America/New_York",
] as const;

export const supportedLocales = ["en", "ar"] as const;

export type SupportedTimezone = (typeof supportedTimezones)[number];
export type SupportedLocale = (typeof supportedLocales)[number];

export function profileInitials(fullName: string | null, email: string | null) {
  const source = fullName?.trim() || email?.split("@")[0]?.replace(/[._-]+/g, " ") || "Rama staff";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RR";
}

export function profileDisplayName(fullName: string | null, email: string | null) {
  if (fullName?.trim()) return fullName.trim();
  const localPart = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!localPart) return "Rama staff";
  return localPart.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function safeExternalAvatarUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
