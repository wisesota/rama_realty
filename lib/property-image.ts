export function isAllowedPropertyImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (
        url.hostname === "images.unsplash.com"
        || (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/"))
      );
  } catch {
    return false;
  }
}
