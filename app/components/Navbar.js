"use client";

import Link from "next/link";
import { useState } from "react";
import { usePortfolio } from "./PortfolioProvider";
import DarkModeToggle from "./DarkModeToggle";
import PortfolioImage from "./PortfolioImage";
import { NavbarSkeleton } from "./PortfolioSkeleton";

const links = [
  ["About", "/about"],
  ["Projects", "/projects"],
  ["Training", "/achievements"],
  ["Contact", "/contact"],
];

const contactCtaClassName =
  "group relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full border border-[#a5f4dc]/80 bg-gradient-to-r from-[#69ebc4] via-[#4ed8b6] to-[#20b994] px-4 py-2 text-sm font-semibold text-[#062822] shadow-[0_6px_20px_rgba(46,195,154,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(46,195,154,0.4)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f3d0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a171d] motion-reduce:transition-none";

function ContactCta({ className = "", onClick }) {
  return (
    <Link
      href="/contact"
      onClick={onClick}
      className={`${contactCtaClassName} ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-1/3 top-[-70%] h-[240%] w-1/4 rotate-[25deg] bg-gradient-to-r from-transparent via-white/65 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100 motion-reduce:transition-none"
      />
      <span className="relative z-10">Let&apos;s talk</span>
      <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#063b32]/10 transition-colors duration-200 group-hover:bg-[#063b32]/15">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.2A7.5 7.5 0 1 1 20 11.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { home, loading } = usePortfolio();
  if (loading) return <NavbarSkeleton />;

  const initials = (home.name || "Portfolio")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const navLinks = links.map(([label, href]) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMenuOpen(false)}
      className="text-sm font-medium text-white/70 transition hover:text-[#5be0bf]"
    >
      {label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a171d]/95 text-white shadow-[0_8px_28px_rgba(4,17,22,0.12)] backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-5 px-5 md:px-8"
      >
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <PortfolioImage
            url={home.photo?.url}
            alt={`${home.name} profile`}
            fallbackText={initials}
            fallbackClassName="text-sm font-bold tracking-wide text-[#67e1c2]"
            className="h-10 w-10 shrink-0 rounded-xl border border-[#4ed8b6]/50 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-wide text-white">
              {home.name}
            </span>
            <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[0.24em] text-white/45">
              Personal portfolio
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks}
          <DarkModeToggle />
          <ContactCta />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <DarkModeToggle />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {menuOpen ? (
                <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path
                  strokeLinecap="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="grid gap-1 border-t border-white/10 bg-[#0a171d] px-5 py-4 md:hidden"
        >
          {navLinks}
          <ContactCta className="mt-2 w-fit" onClick={() => setMenuOpen(false)} />
        </div>
      )}
    </header>
  );
}
