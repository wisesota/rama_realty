import { NextResponse, type NextRequest } from "next/server";
import {
  isPublicLocale,
  localeCookieName,
  localeRequestHeader,
  preferredPublicLocale,
} from "@/lib/i18n";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";
import { landingCompositionEnabled, localeRoutesEnabled } from "@/lib/rollout-flags";

const cookieOptions = {
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = pathname.split("/")[1];
  const useLocaleRoutes = localeRoutesEnabled();
  const publicPage = pathname === "/"
    || pathname === "/discover"
    || pathname.startsWith("/discover/")
    || (isPublicLocale(pathLocale) && (pathname === `/${pathLocale}` || pathname.startsWith(`/${pathLocale}/discover`)));

  if (publicPage && !landingCompositionEnabled()) {
    const operationalLocale = isPublicLocale(pathLocale)
      ? pathLocale
      : preferredPublicLocale({
          cookie: request.cookies.get(localeCookieName)?.value,
          acceptLanguage: request.headers.get("accept-language"),
        });
    return new Response(operationalLocale === "ar" ? "تجربة راما غير متاحة مؤقتاً." : "Rama is temporarily unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8", "Retry-After": "60" },
    });
  }

  if (useLocaleRoutes && (pathname === "/" || pathname === "/discover" || pathname.startsWith("/discover/"))) {
    const locale = preferredPublicLocale({
      cookie: request.cookies.get(localeCookieName)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    });
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    const response = NextResponse.redirect(destination, 307);
    response.cookies.set(localeCookieName, locale, cookieOptions);
    return response;
  }

  if (!useLocaleRoutes && isPublicLocale(pathLocale)) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === `/${pathLocale}`
      ? "/"
      : pathname.replace(`/${pathLocale}`, "");
    return NextResponse.redirect(destination, 307);
  }

  const requestHeaders = new Headers(request.headers);
  if (isPublicLocale(pathLocale)) requestHeaders.set(localeRequestHeader, pathLocale);
  const response = await refreshSupabaseSession(request, requestHeaders);
  if (isPublicLocale(pathLocale)) response.cookies.set(localeCookieName, pathLocale, cookieOptions);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.well-known/workflow|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
