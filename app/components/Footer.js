"use client";

import Link from "next/link";
import { usePortfolio } from "./PortfolioProvider";

const currentYear = new Date().getFullYear();

export default function Footer() {
  const { home, contact } = usePortfolio();
  const mapLocation = contact.location;

  return (
    <footer className="bg-[#0a171d] text-white">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-16 md:px-8 md:pt-20">
        <div
          className={`grid gap-12 border-b border-white/10 pb-12 ${
            mapLocation
              ? "lg:grid-cols-[1.05fr_0.8fr_1.15fr]"
              : "lg:grid-cols-2"
          }`}
        >
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5be0bf]">
              Have a project in mind?
            </p>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Let&apos;s make something useful.
            </h2>
            <p className="mt-4 max-w-sm leading-7 text-white/60">
              Have a question or want to talk about an opportunity? I&apos;d be
              glad to hear from you.
            </p>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="mt-6 inline-flex items-center gap-2 font-semibold text-[#62e2c2] transition hover:text-white"
              >
                {contact.email}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Explore
            </p>
            <div className="grid gap-3 text-sm text-white/70">
              <Link className="transition hover:text-[#5be0bf]" href="/about">
                About
              </Link>
              <Link className="transition hover:text-[#5be0bf]" href="/projects">
                Projects
              </Link>
              <Link
                className="transition hover:text-[#5be0bf]"
                href="/achievements"
              >
                Training &amp; certificates
              </Link>
              <Link className="transition hover:text-[#5be0bf]" href="/contact">
                Contact
              </Link>
            </div>
            {contact.location && (
              <p className="mt-8 text-sm text-white/60">{contact.location}</p>
            )}
          </div>

          {mapLocation && (
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Based in {mapLocation}
              </p>
              <div className="h-48 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <iframe
                  title={`Map of ${mapLocation}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    mapLocation,
                  )}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {home.name}. All rights reserved.
          </p>
          {contact.website && (
            <a
              href={contact.website}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-[#5be0bf]"
            >
              Personal website ↗
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
