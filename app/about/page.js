"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePortfolio } from "../components/PortfolioProvider";
import PortfolioImage from "../components/PortfolioImage";
import SectionHeading from "../components/SectionHeading";
import { AboutSkeleton } from "../components/PortfolioSkeleton";
import RichTextContent from "../components/RichTextContent";
import { formatExperienceDateRange } from "../../lib/experienceDates";
import { MAX_ABOUT_PHOTOS } from "../../lib/portfolio";

export default function AboutPage() {
  const { home, about, experience, loading } = usePortfolio();
  const timelineRef = useRef(null);
  const skillsDialogRef = useRef(null);
  const skillSearchRef = useRef(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setTimelineVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimelineVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(timeline);
    return () => observer.disconnect();
  }, [experience.length]);

  useEffect(() => {
    const dialog = skillsDialogRef.current;
    if (!showAllSkills || !dialog) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    skillSearchRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAllSkills]);

  if (loading) return <AboutSkeleton />;

  const details = [
    ["Current role", about.position],
    ["Education", about.education],
    ["Location", about.location],
    ...(Array.isArray(about.details)
      ? about.details.map((detail) => [detail?.label, detail?.value])
      : []),
  ].filter(
    ([label, value]) =>
      typeof label === "string" &&
      label.trim() &&
      typeof value === "string" &&
      value.trim(),
  );
  const bioParagraphs =
    typeof about.bio === "string"
      ? about.bio.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
      : [];
  const skills = Array.isArray(about.skills)
    ? about.skills.filter(
        (skill) => typeof skill === "string" && skill.trim(),
      )
    : [];
  const photos = Array.isArray(about.photos)
    ? about.photos
        .slice(0, MAX_ABOUT_PHOTOS)
        .filter(
          (photo) =>
            photo &&
            typeof photo.url === "string" &&
            typeof photo.publicId === "string",
        )
    : [];
  const photoGridClass =
    photos.length === 1
      ? "lg:mx-auto lg:max-w-sm lg:grid-cols-1"
      : photos.length === 2
        ? "lg:mx-auto lg:max-w-3xl lg:grid-cols-2"
        : photos.length === 3
          ? "lg:grid-cols-3"
          : "lg:grid-cols-4";
  const visibleSkills = skills.slice(0, 10);
  const normalizedSkillQuery = skillQuery.trim().toLowerCase();
  const matchingSkills = normalizedSkillQuery
    ? skills.filter((skill) => skill.toLowerCase().includes(normalizedSkillQuery))
    : skills;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <SectionHeading
        centered
        eyebrow="A little about me"
        title="Turning ideas into practical solutions."
        description={`I’m ${home.name}. ${about.position ? `${about.position}.` : ""}`}
      />

      {bioParagraphs.length > 0 && (
        <section className="mt-12" aria-labelledby="about-perspective-heading">
          <div className="mb-5 flex items-center gap-4">
            <h2
              id="about-perspective-heading"
              className="text-sm font-semibold text-[#20363a] dark:text-white/85"
            >
              My perspective
            </h2>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-[#cce5db] to-transparent dark:from-white/15"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bioParagraphs.map((paragraph, index) => (
              <article
                key={`perspective-${index}`}
                style={{ animationDelay: `${120 + index * 100}ms` }}
                className="animate-about-card-enter group relative overflow-hidden rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] motion-reduce:transition-none sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-6 top-0 h-0.5 bg-gradient-to-r from-[#4bc9a4] via-[#a5e5ce] to-transparent opacity-70"
                />
                <p className="font-mono text-xs font-medium tabular-nums text-[#168e78] dark:text-[#5be0bf]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-4 text-sm leading-7 text-[#4f6266] dark:text-white/70 sm:text-[15px]">
                  {paragraph}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-14 grid grid-cols-1 gap-8">
        <article
          style={{ animationDelay: "120ms" }}
          className="animate-about-card-enter min-w-0 rounded-[1.5rem] border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_16px_50px_rgba(16,54,48,0.08)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] sm:p-9"
        >
          {photos.length > 0 && (
            <section className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#20363a] dark:text-white/85">
                  A few photos of me
                </h3>
                <span className="text-xs text-[#778785] dark:text-white/45">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </span>
              </div>
              <div
                className={`-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3 sm:-mx-9 sm:gap-4 sm:px-9 lg:mx-0 lg:grid lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0 ${photoGridClass}`}
              >
                {photos.map((photo, index) => (
                  <figure
                    key={photo.publicId}
                    style={{ animationDelay: `${240 + index * 120}ms` }}
                    className="animate-about-card-enter w-[min(78vw,20rem)] flex-none snap-center overflow-hidden rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f3fcf8] via-white to-[#e2f5eb] p-2 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-lg dark:border-[#2d705f] dark:from-[#164138] dark:via-[#123a31] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 motion-reduce:transition-none lg:w-auto"
                  >
                    <PortfolioImage
                      url={photo.url}
                      alt={`${home.name}, photo ${index + 1}`}
                      objectFit="contain"
                      className="aspect-[2/3] w-full rounded-xl bg-[#e7efec] dark:bg-[#0b1c22]"
                    />
                  </figure>
                ))}
              </div>
              {photos.length > 1 && (
                <p className="mt-1 text-xs text-[#778785] dark:text-white/45 lg:hidden">
                  Swipe to see the other photos
                </p>
              )}
            </section>
          )}
          {details.length > 0 && (
            <dl className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {details.map(([label, value], index) => (
                <div
                  key={`${label}-${index}`}
                  className="rounded-xl border border-[#b8e8d7] bg-gradient-to-br from-[#f3fcf8] to-[#e5f5ed] p-4 transition-colors hover:border-[#65c9a9] dark:border-[#2d705f] dark:from-[#123a31] dark:to-[#102127] dark:hover:border-[#4ed8b6]/50"
                >
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#778785] dark:text-white/45">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm font-medium leading-6 text-[#20363a] dark:text-white/85">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </article>

        {skills.length > 0 && (
          <aside
            style={{ animationDelay: "280ms" }}
            className="animate-about-card-enter relative isolate min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-[#163a3c] via-[#102a30] to-[#0b2026] p-6 text-white shadow-[0_18px_50px_rgba(9,32,38,0.12)] sm:p-9"
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 -z-10 h-48 w-48 rounded-full bg-[#39c8a4]/10 blur-3xl"
            />
            <div className="relative grid gap-7 xl:grid-cols-[0.85fr_1.15fr] xl:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1 w-5 rounded-full bg-[#68e0c1]"
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#68e0c1]">
                    Tools &amp; skills
                  </p>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                  The toolkit I bring to the work.
                </h2>
                <div className="mt-5 flex items-center gap-3 border-y border-white/10 py-3">
                  <span className="text-3xl font-semibold tracking-tight text-[#68e0c1]">
                    {skills.length}
                  </span>
                  <span className="text-xs leading-5 text-white/60">
                    skills and tools
                  </span>
                </div>
              </div>
              <div>
                <ul className="flex flex-wrap gap-2">
                  {visibleSkills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
                {skills.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills(true)}
                    className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-left transition hover:border-[#68e0c1]/50 hover:bg-white/[0.08] focus-visible:outline-white"
                  >
                    <span className="text-sm font-semibold text-[#68e0c1]">
                      View all skills
                    </span>
                    <span aria-hidden="true" className="text-lg text-[#68e0c1]">
                      ↗
                    </span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <dialog
        ref={skillsDialogRef}
        aria-labelledby="all-skills-title"
        onClose={() => {
          setShowAllSkills(false);
          setSkillQuery("");
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            skillsDialogRef.current?.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-3xl border border-white/80 bg-white p-0 text-[#183037] shadow-[0_24px_70px_rgba(16,54,48,0.2)] backdrop:bg-[#0b1c22]/70 backdrop:backdrop-blur-sm open:flex open:flex-col dark:border-white/10 dark:bg-[#102127] dark:text-white dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e5eeea] p-5 dark:border-white/10 sm:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#168e78] dark:text-[#5be0bf]">
              Tools &amp; skills
            </p>
            <h2
              id="all-skills-title"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              The full toolkit
            </h2>
            <p className="mt-1 text-sm text-[#65777a] dark:text-white/55">
              {skills.length} skills and technologies
            </p>
          </div>
          <button
            type="button"
            onClick={() => skillsDialogRef.current?.close()}
            aria-label="Close skills list"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dce7e4] bg-[#f5f9f7] text-lg text-[#345650] transition hover:bg-[#e1f1ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:border-white/15 dark:bg-white/5 dark:text-[#d9f3ec] dark:hover:bg-white/15 dark:focus-visible:outline-[#5be0bf]"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
          <label htmlFor="all-skills-search" className="sr-only">
            Search skills
          </label>
          <input
            ref={skillSearchRef}
            id="all-skills-search"
            type="search"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-xl border border-[#dce7e4] bg-[#f8fbf9] px-4 py-3 text-sm text-[#183037] outline-none transition placeholder:text-[#8b9b95] focus:border-[#168e78] focus:ring-4 focus:ring-[#168e78]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/35 dark:focus:border-[#5be0bf] dark:focus:ring-[#5be0bf]/10"
          />
          <p
            aria-live="polite"
            className="mt-4 text-xs font-medium text-[#778785] dark:text-white/45"
          >
            {normalizedSkillQuery
              ? `${matchingSkills.length} matching skills`
              : "Browse the complete list"}
          </p>
          <ul className="mt-3 grid min-h-0 max-h-[45dvh] flex-1 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2">
            {matchingSkills.map((skill, index) => (
              <li
                key={`${skill}-${index}`}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-[#e5eeea] bg-white px-3 py-2 text-sm text-[#345650] dark:border-white/10 dark:bg-white/[0.03] dark:text-white/80"
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#21b995]"
                />
                {skill}
              </li>
            ))}
          </ul>
          {matchingSkills.length === 0 && (
            <p className="py-10 text-center text-sm text-[#65777a] dark:text-white/55">
              No skills match “{skillQuery}”.
            </p>
          )}
        </div>
      </dialog>

      {experience.length > 0 && (
        <section className="mt-20 md:mt-28">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#168e78] dark:text-[#5be0bf]">
                Professional background
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#122126] dark:text-white sm:text-4xl">
                Experience
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-sm font-semibold text-[#168e78] hover:text-[#0d5f51] dark:text-[#5be0bf]"
            >
              See selected projects ↗
            </Link>
          </div>
          <div
            ref={timelineRef}
            className="relative ml-2 pl-7 sm:ml-4 sm:pl-10"
          >
            <div
              aria-hidden="true"
              className={`absolute bottom-0 left-0 top-0 w-[3px] origin-top rounded-full bg-gradient-to-b from-[#168e78] via-[#7fcdb7] to-[#d6ebe3] dark:from-[#5be0bf] dark:via-[#367f70] dark:to-[#153932] ${
                timelineVisible ? "animate-experience-timeline-line" : ""
              }`}
            />
            {experience.map((item, index) => {
              const dateRange = formatExperienceDateRange(item);
              const isCurrent = item.isCurrent ?? dateRange.endsWith("Present");

              return (
                <article
                  key={item.id}
                  style={
                    timelineVisible
                      ? { animationDelay: `${index * 130}ms` }
                      : undefined
                  }
                  className={`relative pb-7 last:pb-0 ${
                    timelineVisible ? "animate-experience-card-enter" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    style={
                      timelineVisible
                        ? { animationDelay: `${400 + index * 130}ms` }
                        : undefined
                    }
                    className={`absolute -left-[2.25rem] top-[1.625rem] h-4 w-4 rounded-full border-[3px] sm:-left-[3rem] ${
                      isCurrent
                        ? "experience-timeline-node-current z-10 border-white bg-[#168e78] ring-4 ring-[#23a98c]/25 shadow-[0_0_18px_4px_rgba(35,169,140,0.4)] dark:border-[#102127] dark:bg-[#5be0bf] dark:ring-[#5be0bf]/30 dark:shadow-[0_0_20px_5px_rgba(91,224,191,0.45)]"
                        : "border-white bg-[#a8b8b2] ring-2 ring-[#8b9b95]/15 dark:border-[#102127] dark:bg-[#667b74] dark:ring-white/10"
                    } ${
                      timelineVisible ? "animate-experience-timeline-node" : ""
                    }`}
                  />
                  <div className="group rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-5 shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:p-6 motion-reduce:transition-none">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-[#1a3035] dark:text-white">
                          {item.title}
                        </h3>
                        {item.organization && (
                          <p className="mt-1 text-sm font-medium text-[#637578] dark:text-white/55">
                            {item.organization}
                          </p>
                        )}
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-3">
                        {item.organizationLogo?.url && (
                          <PortfolioImage
                            url={item.organizationLogo.url}
                            alt={`${item.organization || "Company"} logo`}
                            objectFit="contain"
                            transparent
                            className="h-10 w-10"
                          />
                        )}
                        {dateRange && (
                          <span className="rounded-full border border-[#b8e8d7] bg-gradient-to-r from-[#f3fcf8] to-[#e3f6ed] px-3 py-1.5 text-right text-xs font-semibold text-[#168e78] dark:border-[#2d705f] dark:from-[#123a31] dark:to-[#102127] dark:text-[#5be0bf]">
                            {dateRange}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <div className="mt-5 border-t border-[#e5eeea] pt-4 dark:border-white/10">
                        <RichTextContent
                          content={item.description}
                          className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#68797c] dark:text-white/65"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
