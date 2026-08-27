import Link from "next/link";
import { ArrowUpRight, CircleHelp } from "lucide-react";
import { BoundaryLedger } from "@/components/rama/boundary-ledger";
import { ComparisonPlane } from "@/components/rama/comparison-plane";
import { ConsentHandoff } from "@/components/rama/consent-handoff";
import { CriteriaSlip, type CriteriaSlipModel } from "@/components/rama/criteria-slip";
import { DecisionLedgerTimeline } from "@/components/rama/decision-ledger-timeline";
import { DecisionSpecimen } from "@/components/rama/decision-specimen";
import { EditorialMedia } from "@/components/rama/editorial-media";
import { ExampleBriefs } from "@/components/rama/example-briefs";
import { ProcessRail } from "@/components/rama/process-rail";
import { ReturnToBrief } from "@/components/rama/return-to-brief";
import { SectionShell } from "@/components/rama/section-shell";
import { DiscoveryComposerIsland } from "@/components/rama/discovery-composer-island";
import { Logo } from "@/components/logo";
import { CinematicHeroMedia } from "@/components/rama/cinematic-hero-media";
import { SiteHeader } from "@/components/site-header";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import type { LandingCopy, PublicLocale } from "@/lib/i18n";
import { cinematicHeroEnabled } from "@/lib/rollout-server";

export function DecisionArchitectureLanding({ locale, copy }: { locale: PublicLocale; copy: LandingCopy }) {
  const architecture = copy.architecture;
  const cinematicHero = cinematicHeroEnabled();
  const composerCopy = {
    ...copy,
    architecture: {
      hero: architecture.hero,
      voice: architecture.voice,
    },
  };
  const isArabic = locale === "ar";
  const exampleCriteria: CriteriaSlipModel = {
    source: "example",
    required: [
      { key: "bedrooms", label: isArabic ? "غرفتا نوم" : "2 bedrooms", value: isArabic ? "غرفتا نوم" : "2 bedrooms", kind: "hard" },
      { key: "budget", label: isArabic ? "حتى 3 ملايين درهم" : "Up to AED 3M", value: isArabic ? "حتى 3 ملايين درهم" : "Up to AED 3M", kind: "hard" },
    ],
    preferred: [
      { key: "waterfront", label: isArabic ? "واجهة مائية" : "Waterfront", value: isArabic ? "واجهة مائية" : "Waterfront", kind: "preference" },
      { key: "walkable", label: isArabic ? "قابل للمشي" : "Walkable", value: isArabic ? "قابل للمشي" : "Walkable", kind: "preference" },
    ],
    unknowns: [isArabic ? "مدى تقبل رسوم الخدمة" : "service-charge tolerance"],
    contradictions: [],
  };

  return (
    <>
      <a className="skip-link" href="#main-content">{copy.skip}</a>
      <ScrollProgress />
      <SiteHeader locale={locale} copy={copy.header} variant="cinematic" />
      <main id="main-content" className="decision-architecture-landing">
        <section
          id="top"
          className={`decision-hero${cinematicHero ? " decision-hero--cinematic" : ""}`}
          aria-labelledby="hero-title"
        >
          {cinematicHero ? <CinematicHeroMedia /> : null}
          <SectionShell className="decision-hero__shell">
            <div className="decision-hero__intro">
              <h1 id="hero-title">{architecture.hero.title}</h1>
              <p>{architecture.hero.body}</p>
            </div>
            <DiscoveryComposerIsland
              locale={locale}
              copy={composerCopy}
              signalSrc="/lottie/ai.json"
            />
            <noscript><p className="decision-hero__noscript">{architecture.hero.noScript}</p></noscript>
          </SectionShell>
        </section>
        <div id="architecture" className="decision-section decision-section--chalk">
          <SectionShell>
            <div className="architecture-media" role="group" aria-label={architecture.media.label}>
              <EditorialMedia
                media={architecture.media.architecture[0]}
                label={architecture.media.label}
                sizes="(max-width: 768px) 100vw, (max-width: 1240px) 58vw, 715px"
                className="architecture-media__primary"
              />
              <EditorialMedia
                media={architecture.media.architecture[1]}
                label={architecture.media.label}
                sizes="(max-width: 768px) 82vw, (max-width: 1240px) 42vw, 515px"
                aspect="portrait"
                className="architecture-media__secondary"
              />
            </div>
            <div className="architecture-proof">
              <CriteriaSlip model={exampleCriteria} locale={locale} />
            </div>
            <div className="architecture-panes">
              {architecture.architecture.panes.map((pane, index) => (
                <article key={pane.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>{pane.label}</small>
                  <h3>{pane.title}</h3>
                  <p>{pane.body}</p>
                </article>
              ))}
            </div>
          </SectionShell>
        </div>

        <section id="examples" className="decision-section decision-section--ink" aria-labelledby="examples-title">
          <SectionShell>
            <header className="decision-section__heading">
              <h2 id="examples-title">{architecture.examples.title}</h2>
              <p>{architecture.examples.body}</p>
            </header>
            <ExampleBriefs
              items={architecture.examples.items}
              chooseLabel={architecture.examples.choose}
              constraintLabel={architecture.examples.constraintLabel}
              tradeoffLabel={architecture.examples.tradeoffLabel}
              mediaLabel={architecture.media.label}
              media={architecture.media.examples}
            />
          </SectionShell>
        </section>

        <section id="capabilities" className="decision-section decision-section--paper" aria-labelledby="capabilities-title">
          <SectionShell>
            <header className="decision-section__heading decision-section__heading--split">
              <div><h2 id="capabilities-title">{architecture.capabilities.title}</h2></div>
              <p>{architecture.capabilities.body}</p>
            </header>
            <div className="capability-specimen">
              <div className="capability-specimen__visual">
                <EditorialMedia
                  media={architecture.media.capability}
                  label={architecture.media.label}
                  sizes="(max-width: 1024px) 100vw, (max-width: 1240px) 58vw, 715px"
                  className="capability-specimen__media"
                />
                <ComparisonPlane columns={[
                  { title: isArabic ? "الموجز" : "Brief", values: [{ label: isArabic ? "الميزانية" : "Budget", value: isArabic ? "حتى 3 ملايين درهم" : "Up to AED 3M", confirmed: true }, { label: isArabic ? "رسوم الخدمة" : "Service charge", value: isArabic ? "غير معروف" : "Unknown" }] },
                  { title: isArabic ? "المرشح" : "Candidate", values: [{ label: isArabic ? "الميزانية" : "Budget", value: isArabic ? "ضمن الحد" : "Within ceiling", confirmed: true }, { label: isArabic ? "رسوم الخدمة" : "Service charge", value: isArabic ? "غير متاح" : "Not supplied" }] },
                ]} />
                <DecisionLedgerTimeline items={[
                  { id: "brief", label: isArabic ? "تم تأكيد الموجز" : "Brief confirmed", detail: isArabic ? "المطلوب والمفضّل ظاهران." : "Required and preferred criteria are visible." },
                  { id: "question", label: isArabic ? "سؤال مفتوح" : "Open question", detail: isArabic ? "رسوم الخدمة ما زالت غير معروفة." : "Service charge remains unknown." },
                ]} />
              </div>
              <ol className="capability-specimen__index">
                {architecture.capabilities.items.map((item, index) => <li key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}
              </ol>
            </div>
          </SectionShell>
        </section>

        <section id="specimen" className="decision-section decision-section--sky" aria-labelledby="specimen-title">
          <SectionShell>
            <header className="decision-section__heading decision-section__heading--split">
              <div><h2 id="specimen-title">{architecture.specimen.title}</h2></div>
              <p>{architecture.specimen.body}</p>
            </header>
            <DecisionSpecimen items={architecture.specimen.items} ariaLabel={architecture.specimen.title} />
          </SectionShell>
        </section>

        <section id="method" className="decision-section decision-section--chalk" aria-labelledby="method-title">
          <SectionShell>
            <header className="decision-section__heading decision-section__heading--center">
              <h2 id="method-title">{architecture.method.title}</h2>
              <p>{architecture.method.body}</p>
            </header>
            <ProcessRail steps={architecture.method.steps} previousLabel={architecture.method.previous} nextLabel={architecture.method.next} />
          </SectionShell>
        </section>

        <section id="boundaries" className="decision-section decision-section--ink boundary-section" aria-labelledby="boundaries-title">
          <SectionShell>
            <div className="boundary-section__heading">
              <h2 id="boundaries-title">{architecture.boundaries.title}</h2>
              <p>{architecture.boundaries.body}</p>
              <ConsentHandoff eligible={false} title={isArabic ? "سجل توضيحي" : "Illustrative record"} body={isArabic ? "تحويل المستشار غير متاح لهذا السجل." : "Advisor handoff is unavailable for this record."} />
            </div>
            <BoundaryLedger items={architecture.boundaries.items} />
          </SectionShell>
        </section>

        <section id="briefings" className="decision-section decision-section--paper" aria-labelledby="briefings-title">
          <SectionShell>
            <header className="decision-section__heading decision-section__heading--wide">
              <h2 id="briefings-title">{architecture.briefings.title}</h2>
              <p>{architecture.briefings.body}</p>
            </header>
            <div className="buyer-briefings">
              {architecture.briefings.items.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><CircleHelp aria-hidden="true" /></article>)}
            </div>
          </SectionShell>
        </section>

        <section id="faq" className="decision-section decision-section--chalk faq-section" aria-labelledby="faq-title">
          <SectionShell>
            <header className="decision-section__heading decision-section__heading--center">
              <h2 id="faq-title">{architecture.faq.title}</h2>
            </header>
            <div className="faq-list">
              {architecture.faq.items.map((item, index) => <details key={item.question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<i aria-hidden="true">+</i></summary><p>{item.answer}</p></details>)}
            </div>
          </SectionShell>
        </section>

        <section className="decision-closing" aria-labelledby="closing-title">
          <EditorialMedia
            media={architecture.media.closing}
            label={architecture.media.label}
            sizes="100vw"
            aspect="panorama"
            className="decision-closing__media"
          />
          <SectionShell className="decision-closing__content">
            <h2 id="closing-title">{architecture.closing.title}</h2>
            <p>{architecture.closing.body}</p>
            <ReturnToBrief label={architecture.closing.action} />
          </SectionShell>
        </section>
      </main>

      <footer className="decision-footer">
        <SectionShell>
          <div className="decision-footer__brand"><Logo /><p>{architecture.footer.summary}</p></div>
          <nav aria-label={isArabic ? "روابط التذييل" : "Footer navigation"}>
            <a href="#method">{architecture.footer.method}</a>
            <a href="#boundaries">{architecture.footer.boundaries}</a>
            <a href="#boundaries">{architecture.footer.privacy}</a>
            <a href="#boundaries">{architecture.footer.dataRights}</a>
            <Link href="/auth/sign-in">{architecture.footer.staff}<ArrowUpRight aria-hidden="true" /></Link>
          </nav>
          <div className="decision-footer__legal"><p>© {new Date().getFullYear()} Rama.</p><p>{architecture.footer.disclosure}</p></div>
        </SectionShell>
      </footer>
    </>
  );
}
