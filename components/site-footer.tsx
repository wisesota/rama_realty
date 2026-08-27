import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import type { LandingCopy } from "@/lib/i18n";

export function SiteFooter({ copy }: { copy: LandingCopy["footer"] }) {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-main px-4 md:px-8 xl:px-10">
        <div className="footer-brand">
          <Logo />
          <p>{copy.summary}</p>
        </div>

        <div className="footer-nav">
          <div>
            <span>{copy.explore}</span>
            <a href="#top">{copy.invitation}</a>
            <a href="#trust">{copy.method}</a>
          </div>
          <div>
            <span>{copy.concierge}</span>
            <a href="#guided-search">
              {copy.shape}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="section-shell footer-legal px-4 md:px-8 xl:px-10">
        <p>© {new Date().getFullYear()} Rama.</p>
        <p>
          {copy.disclaimer}
        </p>
      </div>
      <p className="footer-wordmark" aria-hidden="true">RAMA</p>
    </footer>
  );
}
