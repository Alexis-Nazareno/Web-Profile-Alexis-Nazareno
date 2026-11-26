"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePortfolio } from "./components/PortfolioProvider";
import PortfolioCard from "./components/PortfolioCard";
import PortfolioImage from "./components/PortfolioImage";
import PortfolioFileLink from "./components/PortfolioFileLink";
import FeedbackSection from "./components/FeedbackSection";
import VantaBirdsBackground from "./components/VantaBirdsBackground";
import { HomeSkeleton } from "./components/PortfolioSkeleton";
import RichTextContent from "./components/RichTextContent";
import HolidayEventCard from "./components/HolidayEventCard";
import { formatExperienceDateRange } from "../lib/experienceDates";
import {
  isHighlightActive,
} from "../lib/highlightSchedule.mjs";

const EXPERIENCE_PAGE_SIZE = 3;

function getHeroSummary(headline = "") {
  const trimmed = headline.trim();
  const sentenceEnd = trimmed.search(/[.!?](?:\s|$)/);
  const summary =
    sentenceEnd === -1 ? trimmed : trimmed.slice(0, sentenceEnd + 1);

  if (summary.length <= 100) return summary;
  return `${summary.slice(0, 97).trimEnd()}...`;
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10h12m-5-5 5 5-5 5"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2.5v9m0 0 3.5-3.5M10 11.5 6.5 8M4 13.5v4h12v-4" />
    </svg>
  );
}

export default function HomePage() {
  const {
    home,
    about,
    contact,
    projects,
    experience,
    achievements,
    highlights,
    loading,
  } = usePortfolio();
  const [experiencePage, setExperiencePage] = useState(0);
  const [scheduleNow, setScheduleNow] = useState(0);
  const experiencePageCount = Math.ceil(
    experience.length / EXPERIENCE_PAGE_SIZE,
  );
  const currentExperiencePage = Math.min(
    experiencePage,
    Math.max(0, experiencePageCount - 1),
  );
  const firstVisibleExperience = currentExperiencePage * EXPERIENCE_PAGE_SIZE;
  const visibleExperience = experience.slice(
    firstVisibleExperience,
    firstVisibleExperience + EXPERIENCE_PAGE_SIZE,
  );

  useEffect(() => {
    setExperiencePage(0);
  }, [experience.length]);

  useEffect(() => {
    const updateTime = () => setScheduleNow(Date.now());
    updateTime();
    const intervalId = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (loading) return <HomeSkeleton />;

  const initials = (home.name || "AN")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const location = about.location || contact.location || "Manila, Philippines";
  const heroSummary = getHeroSummary(home.headline);
  const visibleHighlights = highlights.filter((item) =>
    isHighlightActive(item, scheduleNow),
  );
  const statistics = [
    { value: projects.length, label: "Selected projects", href: "/projects" },
    { value: experience.length, label: "Work experiences", href: "/about" },
    {
      value: achievements.length,
      label: "Training & Certificates",
      href: "/achievements",
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#e2ebe7] bg-[#f7faf9] dark:border-white/10 dark:bg-[#09171d]">
        <VantaBirdsBackground />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-32 z-[1] h-[34rem] w-[34rem] rounded-full border border-[#d6ebe4] dark:border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-16 z-[1] h-[28rem] w-[28rem] rounded-full border border-[#d6ebe4] dark:border-white/5"
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:py-20 md:px-8 md:py-24 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative z-10">
            <h1 className="mx-auto max-w-2xl break-words text-center text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#112127] dark:text-white sm:text-6xl lg:mx-0 lg:text-left lg:text-7xl">
              {home.name}
            </h1>
            {heroSummary && (
              <p className="mx-auto mt-5 max-w-xl text-center text-lg font-medium leading-8 text-[#384b50] dark:text-white/80 sm:text-xl lg:mx-0 lg:text-left">
                {heroSummary}
              </p>
            )}
            <div className={`mx-auto mt-8 max-w-md gap-3 lg:mx-0 lg:flex lg:max-w-none lg:flex-wrap lg:justify-start ${home.resume?.url ? "grid grid-cols-1 min-[360px]:grid-cols-2" : "flex justify-center"}`}>
              <Link
                href="/projects"
                className="group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-[#a5f4dc]/80 bg-gradient-to-r from-[#69ebc4] via-[#4ed8b6] to-[#20b994] px-3 py-3.5 text-xs font-semibold text-[#062822] shadow-[0_6px_20px_rgba(46,195,154,0.28)] transition-all duration-300 hover:shadow-[0_10px_28px_rgba(46,195,154,0.4)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168e78] focus-visible:ring-offset-2 min-[400px]:text-sm sm:px-6 dark:focus-visible:ring-[#a7f3d0] dark:focus-visible:ring-offset-[#09171d] motion-reduce:transition-none"
              >
                <span aria-hidden="true" className="pointer-events-none absolute -left-1/3 top-[-70%] h-[240%] w-1/4 rotate-[25deg] bg-gradient-to-r from-transparent via-white/65 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100 motion-reduce:transition-none" />
                <span className="relative z-10">Explore my work</span>
                <span className="relative z-10"><ArrowIcon /></span>
              </Link>
              <PortfolioFileLink
                href={home.resume?.url}
                className="group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-[#b8d9cf] bg-gradient-to-r from-white via-[#f3fcf8] to-[#e3f6ed] px-3 py-3.5 text-xs font-semibold text-[#253b3e] shadow-sm transition-all duration-300 hover:border-[#21b995] hover:text-[#168e78] hover:shadow-[0_10px_28px_rgba(16,54,48,0.12)] motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168e78] focus-visible:ring-offset-2 min-[400px]:text-sm sm:px-6 dark:border-white/20 dark:from-[#102127] dark:via-[#163530] dark:to-[#123a31] dark:text-white/85 dark:hover:border-[#5be0bf]/50 dark:hover:text-[#5be0bf] dark:focus-visible:ring-[#a7f3d0] dark:focus-visible:ring-offset-[#09171d] motion-reduce:transition-none"
              >
                <span aria-hidden="true" className="pointer-events-none absolute -left-1/3 top-[-70%] h-[240%] w-1/4 rotate-[25deg] bg-gradient-to-r from-transparent via-white/65 to-transparent opacity-0 transition-all duration-700 group-hover:left-[115%] group-hover:opacity-100 motion-reduce:transition-none" />
                <span className="relative z-10">Download CV</span>
                <span className="relative z-10"><DownloadIcon /></span>
              </PortfolioFileLink>
            </div>
          </div>

          <div className="relative order-first mx-auto w-full max-w-[27rem] sm:order-none lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-5 h-28 w-28 rounded-[2rem] bg-gradient-to-br from-[#c4f1e4] via-[#71d8b8] to-[#168e78] dark:from-[#2b8770] dark:via-[#1b5148] dark:to-[#123a31]"
            />
            <div className="relative rounded-[2rem] border border-[#9bdcc8] bg-gradient-to-br from-[#e7f7f0] via-[#c6ebdc] to-[#82ceb5] p-3 shadow-[0_28px_70px_rgba(13,40,43,0.16)] dark:border-[#2d705f] dark:from-[#164138] dark:via-[#123a31] dark:to-[#0d2024] dark:shadow-[0_28px_70px_rgba(0,0,0,0.3)]">
              <PortfolioImage
                url={home.photo?.url}
                alt={`${home.name} profile`}
                fallbackText={initials}
                className="aspect-[4/4.7] w-full rounded-[1.45rem]"
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-[#5be0bf]/30 bg-gradient-to-r from-[#0b1c22]/95 via-[#102a30]/95 to-[#123a31]/95 px-5 py-4 text-white shadow-[0_12px_35px_rgba(0,0,0,0.3)] backdrop-blur-md">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#69dfc1]">
                  Based in
                </p>
                <p className="mt-1 text-sm font-medium">{location}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e3ece8] bg-white dark:border-white/10 dark:bg-[#0d1d23]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#e3ece8] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8 dark:divide-white/10">
          {statistics.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative grid min-h-24 grid-cols-[3rem_10rem] items-center justify-center gap-4 overflow-hidden px-4 py-5 transition-colors duration-300 hover:bg-[#f4fbf8] focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#168e78] motion-reduce:transition-none sm:flex sm:px-7 sm:py-6 dark:hover:bg-white/[0.04] dark:focus-visible:outline-[#5be0bf]"
            >
              <span className="text-right text-3xl font-semibold tracking-tight text-[#168e78] tabular-nums transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none sm:text-left dark:text-[#5be0bf]">
                {String(stat.value).padStart(2, "0")}
              </span>
              <span className="flex min-h-10 items-center whitespace-nowrap text-xs leading-5 text-[#6e7c7e] dark:text-white/55">
                {stat.label}
              </span>
              <span
                aria-hidden="true"
                className="absolute right-4 top-1/2 -translate-x-1 -translate-y-1/2 text-sm text-[#168e78] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-[#5be0bf] motion-reduce:transition-none"
              >
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      {visibleHighlights.length > 0 && (
        <section
          aria-labelledby="holidays-events-heading"
          className="bg-[#f7faf9] py-20 dark:bg-[#09171d] md:py-28"
        >
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
                Culture &amp; community
              </p>
              <h2
                id="holidays-events-heading"
                className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-5xl"
              >
                Holidays &amp; Events
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#68797c] dark:text-white/60 sm:text-base">
                The stories behind the days we celebrate and the events that
                bring people together.
              </p>
            </div>
            <div className="space-y-7">
              {visibleHighlights.map((item, index) => (
                <HolidayEventCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="bg-[#edf4f1] py-20 dark:bg-[#0d1d23] md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
                  Selected work
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
                  A few things I&apos;ve helped bring to life.
                </h2>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] dark:text-[#5be0bf]"
              >
                All projects <ArrowIcon />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <PortfolioCard key={project.id} item={project} showcase />
              ))}
            </div>
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
                The journey
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
                Experience shaped by real-world work.
              </h2>
            </div>
            {experiencePageCount > 1 && (
              <p className="text-sm text-[#68797c] dark:text-white/55">
                Showing {firstVisibleExperience + 1}–
                {Math.min(
                  firstVisibleExperience + EXPERIENCE_PAGE_SIZE,
                  experience.length,
                )}{" "}
                of {experience.length}
              </p>
            )}
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleExperience.map((item, index) => {
              const dateRange = formatExperienceDateRange(item);

              return (
                <article
                  key={item.id}
                  style={{ animationDelay: `${index * 90}ms` }}
                  className="experience-journey-card animate-experience-card-enter group relative flex min-h-[18rem] flex-col overflow-hidden rounded-3xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:p-7"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#dff8ef] via-[#eaf8f2] to-transparent transition-transform duration-300 group-hover:scale-125 dark:from-[#164138]/65 dark:via-[#164138]/25 dark:to-transparent"
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="experience-journey-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#b8e8d7] bg-gradient-to-br from-[#e9faf3] to-[#d4f2e5] text-[#168e78] dark:border-[#2d705f] dark:from-[#164138] dark:to-[#123a31] dark:text-[#5be0bf]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <rect
                          x="3.5"
                          y="7"
                          width="17"
                          height="13.5"
                          rx="2.5"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12h17m-11 0v2h5v-2"
                        />
                      </svg>
                    </span>
                    {dateRange && (
                      <span className="rounded-full border border-[#b8e8d7] bg-gradient-to-r from-[#f3fcf8] to-[#e3f6ed] px-3 py-1.5 text-right text-[11px] font-semibold text-[#168e78] dark:border-[#2d705f] dark:from-[#123a31] dark:to-[#102127] dark:text-[#5be0bf]">
                        {dateRange}
                      </span>
                    )}
                  </div>
                  <div className="relative mt-6 min-h-[5.25rem]">
                    <h3 className="line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-snug tracking-tight text-[#183037] dark:text-white">
                      {item.title}
                    </h3>
                    {item.organization && (
                      <p className="mt-1.5 line-clamp-1 text-sm font-medium text-[#64787a] dark:text-white/55">
                        {item.organization}
                      </p>
                    )}
                  </div>
                  {item.description && (
                    <div className="relative mt-5 border-t border-[#c7e4d9] pt-4 dark:border-white/15">
                      <span aria-hidden="true" className="experience-journey-dot pointer-events-none absolute -top-[3px] h-[5px] w-[5px] rounded-full bg-[#39b995]" />
                      <RichTextContent
                        content={item.description}
                        className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-[#68797c] dark:text-white/60"
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {experiencePageCount > 1 && (
            <nav
              aria-label="Experience pages"
              className="mt-7 flex items-center justify-between gap-4 rounded-2xl border border-[#dce7e4] bg-[#f8fbfa] px-4 py-3 dark:border-white/10 dark:bg-[#102127]"
            >
              <button
                type="button"
                disabled={currentExperiencePage === 0}
                onClick={() =>
                  setExperiencePage((current) => Math.max(0, current - 1))
                }
                className="rounded-full border border-[#dce7e4] px-4 py-2 text-sm font-semibold text-[#40565a] transition hover:border-[#9bdcc8] hover:text-[#11654f] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:border-[#2d705f] dark:hover:text-[#a7eed9]"
              >
                Previous
              </button>
              <p
                aria-live="polite"
                className="text-center text-sm font-medium text-[#68797c] dark:text-white/55"
              >
                Page {currentExperiencePage + 1} of {experiencePageCount}
              </p>
              <button
                type="button"
                disabled={currentExperiencePage >= experiencePageCount - 1}
                onClick={() =>
                  setExperiencePage(
                    (current) =>
                      Math.min(current + 1, experiencePageCount - 1),
                  )
                }
                className="rounded-full border border-[#dce7e4] px-4 py-2 text-sm font-semibold text-[#40565a] transition hover:border-[#9bdcc8] hover:text-[#11654f] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/70 dark:hover:border-[#2d705f] dark:hover:text-[#a7eed9]"
              >
                Next
              </button>
            </nav>
          )}
          <Link
            href="/about"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] dark:text-[#5be0bf]"
          >
            View full experience <ArrowIcon />
          </Link>
        </section>
      )}

      {achievements.length > 0 && (
        <section className="bg-white py-20 dark:bg-[#0d1d23] md:py-28">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
                  Learning &amp; growth
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
                  Training and Certifications.
                </h2>
              </div>
              <Link
                href="/achievements"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] dark:text-[#5be0bf]"
              >
                View all <ArrowIcon />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {achievements.slice(0, 3).map((achievement) => (
                <PortfolioCard
                  key={achievement.id}
                  item={achievement}
                  kind="achievement"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <FeedbackSection />

      <section className="border-t border-[#dce7e4] bg-white py-20 dark:border-white/10 dark:bg-[#122a30] md:py-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
              Beyond the work
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
              Memories and lessons from the journey.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/work-memories"
              className="group flex min-h-56 flex-col items-start justify-between rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] motion-reduce:transition-none sm:p-8"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#168e78] dark:text-[#5be0bf]">
                  Work memories
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#183037] dark:text-white">
                  Moments worth remembering.
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[#68797c] dark:text-white/60">
                  A few moments, people, and milestones from my work journey.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] transition group-hover:gap-3 dark:text-[#5be0bf]">
                Explore memories <ArrowIcon />
              </span>
            </Link>
            <Link
              href="/work-lessons"
              className="group flex min-h-56 flex-col items-start justify-between rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] motion-reduce:transition-none sm:p-8"
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#168e78] dark:text-[#5be0bf]">
                  Work lessons
                </p>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[#183037] dark:text-white">
                  Lessons I carry forward.
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[#68797c] dark:text-white/60">
                  Short reflections on teamwork, adapting, and what work has
                  taught me.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] transition group-hover:gap-3 dark:text-[#5be0bf]">
                Read work lessons <ArrowIcon />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
