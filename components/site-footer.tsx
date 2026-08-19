import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-main px-4 md:px-8 xl:px-10">
        <div className="footer-brand">
          <Logo />
          <p>Property discovery shaped around how you want to live in Dubai.</p>
        </div>

        <div className="footer-nav">
          <div>
            <span>Explore</span>
            <a href="#top">Invitation</a>
            <a href="#trust">Decision method</a>
          </div>
          <div>
            <span>Concierge</span>
            <a href="#guided-search">
              Shape a brief
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="section-shell footer-legal px-4 md:px-8 xl:px-10">
        <p>© {new Date().getFullYear()} Rama Realty.</p>
        <p>
          Illustrative prototype only. Residences, prices, and matches are local samples—not live
          inventory, market data, or real-estate advice.
        </p>
      </div>
      <p className="footer-wordmark" aria-hidden="true">RAMA REALTY</p>
    </footer>
  );
}
