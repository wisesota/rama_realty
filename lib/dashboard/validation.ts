export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
};

export { isAllowedPropertyImageUrl } from "@/lib/property-image";

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
};

export function readText(formData: FormData, name: string, maximum = 500) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function readInteger(formData: FormData, name: string) {
  const value = Number(readText(formData, name, 20));
  return Number.isSafeInteger(value) ? value : null;
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const publicationTransitions = {
  draft: ["in_review", "archived"],
  in_review: ["draft", "published", "archived"],
  published: ["in_review", "archived"],
  archived: ["draft"],
} as const;

export type PublicationStatus = keyof typeof publicationTransitions;

export function canTransitionPublication(current: string, target: string) {
  if (!(current in publicationTransitions)) return false;
  return (publicationTransitions[current as PublicationStatus] as readonly string[]).includes(target);
}
