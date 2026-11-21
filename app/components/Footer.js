"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import facebookIcon from "bootstrap-icons/icons/facebook.svg";
import instagramIcon from "bootstrap-icons/icons/instagram.svg";
import tiktokIcon from "bootstrap-icons/icons/tiktok.svg";
import linkedinIcon from "bootstrap-icons/icons/linkedin.svg";
import githubIcon from "bootstrap-icons/icons/github.svg";
import youtubeIcon from "bootstrap-icons/icons/youtube.svg";
import twitterIcon from "bootstrap-icons/icons/twitter-x.svg";
import threadsIcon from "bootstrap-icons/icons/threads.svg";
import pinterestIcon from "bootstrap-icons/icons/pinterest.svg";
import discordIcon from "bootstrap-icons/icons/discord.svg";
import redditIcon from "bootstrap-icons/icons/reddit.svg";
import blueskyIcon from "bootstrap-icons/icons/bluesky.svg";
import mastodonIcon from "bootstrap-icons/icons/mastodon.svg";
import snapchatIcon from "bootstrap-icons/icons/snapchat.svg";
import telegramIcon from "bootstrap-icons/icons/telegram.svg";
import whatsappIcon from "bootstrap-icons/icons/whatsapp.svg";
import twitchIcon from "bootstrap-icons/icons/twitch.svg";
import spotifyIcon from "bootstrap-icons/icons/spotify.svg";
import behanceIcon from "bootstrap-icons/icons/behance.svg";
import dribbbleIcon from "bootstrap-icons/icons/dribbble.svg";
import { getSocialLinks } from "../../lib/socialLinks.mjs";
import { usePortfolio } from "./PortfolioProvider";
import { FooterSkeleton } from "./PortfolioSkeleton";
import VantaCloudsBackground from "./VantaCloudsBackground";

const currentYear = new Date().getFullYear();
const socialIcons = {
  facebookUrl: facebookIcon,
  instagramUrl: instagramIcon,
  tiktokUrl: tiktokIcon,
  linkedinUrl: linkedinIcon,
  githubUrl: githubIcon,
  youtubeUrl: youtubeIcon,
  twitterUrl: twitterIcon,
  threadsUrl: threadsIcon,
  pinterestUrl: pinterestIcon,
  discordUrl: discordIcon,
  redditUrl: redditIcon,
  blueskyUrl: blueskyIcon,
  mastodonUrl: mastodonIcon,
  snapchatUrl: snapchatIcon,
  telegramUrl: telegramIcon,
  whatsappUrl: whatsappIcon,
  twitchUrl: twitchIcon,
  spotifyUrl: spotifyIcon,
  behanceUrl: behanceIcon,
  dribbbleUrl: dribbbleIcon,
};
const lifeQuotes = [
  "Small steps still move you toward a meaningful life.",
  "Give yourself room to grow at your own pace.",
  "The best moments often begin with being present.",
  "Progress is not always loud; sometimes it looks like trying again.",
  "Make space for the people and moments that feel like home.",
  "You do not need all the answers to take the next step.",
  "A little kindness can make an ordinary day memorable.",
  "Keep becoming someone you are proud to be.",
];
const philippineTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export default function Footer() {
  const { home, about, contact, loading } = usePortfolio();
  const [philippineTime, setPhilippineTime] = useState("");
  const [lifeQuote, setLifeQuote] = useState("");
  const { links: socialLinks, invalid: invalidSocialLinks } = useMemo(
    () => getSocialLinks(contact),
    [contact],
  );

  useEffect(() => {
    const updateTime = () => setPhilippineTime(philippineTimeFormatter.format(new Date()));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLifeQuote(lifeQuotes[Math.floor(Math.random() * lifeQuotes.length)]);
  }, []);

  useEffect(() => {
    if (invalidSocialLinks.length) {
      console.error(`Invalid published social media URLs: ${invalidSocialLinks.join(", ")}.`);
    }
  }, [invalidSocialLinks]);

  if (loading) return <FooterSkeleton />;

  const mapLocation = about.location || contact.location || "Manila, Philippines";

  return (
    <footer className="relative isolate overflow-hidden bg-[#0a171d] text-white">
      <VantaCloudsBackground />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#07191c]/65" />
      <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-16 md:px-8 md:pt-20">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.05fr_0.65fr_1.15fr]">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5be0bf]">
              Have a project in mind?
            </p>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Good ideas start with a conversation.
            </h2>
            <p className="mt-4 max-w-sm leading-7 text-white/60">
              Have a project, opportunity, or story to share? Let&apos;s connect
              and create something meaningful together.
            </p>
            {lifeQuote && (
              <div className="mt-7 max-w-sm border-l-2 border-[#5be0bf]/50 pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5be0bf]/80">
                  A little reminder
                </p>
                <p className="mt-2 text-sm italic leading-6 text-white/70">
                  &ldquo;{lifeQuote}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Beyond work
            </p>
            <div className="grid gap-3 text-sm text-white/70">
              <Link className="transition hover:text-[#5be0bf]" href="/work-memories">
                Work memories
              </Link>
              <Link className="transition hover:text-[#5be0bf]" href="/work-lessons">
                Work lessons
              </Link>
            </div>
            {socialLinks.length > 0 && (
              <div className="mt-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Find me on
                </p>
                <div className="-ml-2 mt-2 flex flex-wrap items-center gap-1">
                  {socialLinks.map(({ field, label, url }) => (
                    <a
                      key={field}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${label} (opens in a new tab)`}
                      title={label}
                      className="flex h-10 w-10 items-center justify-center rounded-md opacity-65 transition hover:-translate-y-0.5 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5be0bf] motion-reduce:transform-none"
                    >
                      <Image
                        src={socialIcons[field]}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 brightness-0 invert"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Find me on the map
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
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-4 grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div aria-hidden="true" className="relative h-10 w-10 text-[#5be0bf]">
                <div className="absolute inset-1 rounded-full bg-[#5be0bf]/10 blur-md" />
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="absolute inset-0 h-full w-full motion-safe:animate-[spin_12s_linear_infinite]"
                >
                  <circle cx="20" cy="20" r="17" stroke="currentColor" strokeOpacity=".2" />
                  <circle cx="20" cy="3" r="2" fill="currentColor" />
                </svg>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute inset-2 h-6 w-6"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Philippine time
                </p>
                <p className="mt-1 text-sm font-medium tabular-nums text-white/90">
                  {philippineTime || "—"} <span className="text-white/45">PHT</span>
                </p>
              </div>
              <svg
                role="img"
                aria-label="Philippine flag"
                viewBox="0 0 60 30"
                className="h-6 w-12 shrink-0 overflow-hidden rounded-sm shadow-sm"
              >
                <path fill="#0038a8" d="M0 0h60v15H0z" />
                <path fill="#ce1126" d="M0 15h60v15H0z" />
                <path fill="#fff" d="M0 0l26 15L0 30z" />
                <circle cx="8" cy="15" r="2.5" fill="#fcd116" />
                <path
                  d="M8 10.5v-1.5m0 12v-1.5M3.5 15H2m12 0h-1.5M4.8 11.8l-1-1m8.4 8.4-1-1m0-6.4 1-1m-8.4 8.4 1-1"
                  stroke="#fcd116"
                  strokeWidth="1.2"
                />
                <path
                  fill="#fcd116"
                  d="m3.3 2.8.6 1.1 1.3.2-.9.9.2 1.3-1.2-.6-1.1.6.2-1.3-.9-.9 1.3-.2zm0 20.9.6 1.1 1.3.2-.9.9.2 1.3-1.2-.6-1.1.6.2-1.3-.9-.9 1.3-.2zm17-10.4.6 1.1 1.3.2-.9.9.2 1.3-1.2-.6-1.1.6.2-1.3-.9-.9 1.3-.2z"
                />
              </svg>
            </div>
          </div>
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
