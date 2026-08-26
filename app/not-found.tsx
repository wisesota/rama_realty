import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  isPublicLocale,
  localeRequestHeader,
  localizedPath,
  type PublicLocale,
} from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Decision Room unavailable",
    title: "This property decision room cannot be restored.",
    body: "The link may be invalid, expired, or owned by another browser session. Rama has not exposed or inferred another buyer’s record.",
    search: "Start a new search",
    home: "Return to Rama",
  },
  ar: {
    eyebrow: "غرفة القرار غير متاحة",
    title: "تعذر استعادة غرفة قرار العقار هذه.",
    body: "قد يكون الرابط غير صالح أو منتهي الصلاحية أو مملوكاً لجلسة متصفح أخرى. لم تكشف راما سجل مشتري آخر ولم تستنتجه.",
    search: "ابدأ بحثاً جديداً",
    home: "العودة إلى راما",
  },
} as const;

export default async function NotFound() {
  const requestedLocale = (await headers()).get(localeRequestHeader);
  const locale: PublicLocale = isPublicLocale(requestedLocale) ? requestedLocale : "en";
  const content = copy[locale];
  const home = localizedPath(locale, "/");

  return (
    <main className="min-h-svh bg-[var(--gallery)] px-5 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col">
        <Link href={home} aria-label={content.home} className="w-fit">
          <Logo />
        </Link>
        <section className="my-auto max-w-3xl border-y border-[var(--rule)] py-14 sm:py-20" aria-labelledby="not-found-title">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="not-found-title" className="mt-3 font-heading text-4xl leading-tight sm:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--body-copy)] sm:text-lg">
            {content.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--ink)] px-5 py-3 text-sm font-semibold !text-white" href={`${home}#guided-search`}>
              <Search aria-hidden="true" className="size-4" /> {content.search}
            </Link>
            <Link className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--rule)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)]" href={home}>
              <ArrowLeft aria-hidden="true" className="size-4" /> {content.home}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
