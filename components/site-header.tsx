"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const navigation = [
  { href: "#residences", label: "Residences" },
  { href: "#services", label: "Services" },
  { href: "#methodology", label: "How Rama works" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      requestAnimationFrame(() => menuButton.current?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand-link" href="#top" aria-label="Rama Realty home">
          <Logo />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <LinkButton className="rama-button rama-button--login" variant="outline" href="/auth/sign-in?next=/dashboard">
            Staff login
          </LinkButton>
          <LinkButton className="rama-button rama-button--header" href="#guided-search">
            Begin a brief
          </LinkButton>
          <Button
            ref={menuButton}
            className="menu-button"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onPress={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-navigation"
          className="mobile-nav px-4 md:px-8"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </a>
          ))}
          <Link href="/auth/sign-in?next=/dashboard" onClick={() => setMenuOpen(false)}>
            Staff login
          </Link>
          <a className="mobile-nav__primary" href="#guided-search" onClick={() => setMenuOpen(false)}>
            Begin a brief
          </a>
        </nav>
      ) : null}
    </header>
  );
}
