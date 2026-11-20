"use client";

import Link from "next/link";
import { usePortfolio } from "./components/PortfolioProvider";
import PortfolioCard from "./components/PortfolioCard";
import PortfolioImage from "./components/PortfolioImage";
import PortfolioFileLink from "./components/PortfolioFileLink";

const skillTracks = [
  {
    number: "01",
    title: "Web applications",
    description:
      "Thoughtful, responsive interfaces that make everyday workflows easier to use.",
    matches: ["Next.js", "React.js", "JavaScript", "HTML5", "CSS3", "Tailwind CSS"],
  },
  {
    number: "02",
    title: "APIs & integrations",
    description:
      "Connecting services and building dependable paths between products and data.",
    matches: ["Node.js", "Express.js", "REST APIs", "SQL"],
  },
  {
    number: "03",
    title: "Business systems",
    description:
      "Experience across enterprise platforms, cloud-connected systems, and delivery.",
    matches: ["Oracle Utilities CCB", "AWS", "CI/CD", "Agile/Scrum"],
  },
];

function shortBio(bio = "") {
  const trimmed = bio.trim();
  if (trimmed.length <= 210) return trimmed;
  return `${trimmed.slice(0, 207).trimEnd()}...`;
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" />
    </svg>
  );
}

export default function HomePage() {
  const { home, about, contact, projects, experience, achievements } =
    usePortfolio();
  const initials = (home.name || "AN")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const location = about.location || contact.location || "Manila, Philippines";
  const skills = about.skills || [];
  const statistics = [
    { value: projects.length, label: "Selected projects" },
    { value: experience.length, label: "Work experiences" },
    { value: achievements.length, label: "Training & certificates" },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[#e2ebe7] bg-[#f7faf9] dark:border-white/10 dark:bg-[#09171d]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-32 h-[34rem] w-[34rem] rounded-full border border-[#d6ebe4] dark:border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-16 h-[28rem] w-[28rem] rounded-full border border-[#d6ebe4] dark:border-white/5"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:py-20 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-24">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#168e78] dark:text-[#5be0bf]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39c5a4]" />
              Software engineer · {location}
            </p>
            <p className="mt-10 text-sm font-medium text-[#68787b] dark:text-white/55">
              Hello, I&apos;m
            </p>
            <h1 className="mt-2 max-w-2xl break-words text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#112127] dark:text-white sm:text-6xl lg:text-7xl">
              {home.name}
              <span className="text-[#23a98c] dark:text-[#5be0bf]">.</span>
            </h1>
            {home.headline && (
              <p className="mt-6 max-w-xl text-xl font-medium leading-8 text-[#384b50] dark:text-white/80 sm:text-2xl">
                {home.headline}
              </p>
            )}
            {about.bio && (
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#697a7e] dark:text-white/60 sm:text-base">
                {shortBio(about.bio)}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full bg-[#0f292d] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#16443f] dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
              >
                Explore my work <ArrowIcon />
              </Link>
              <PortfolioFileLink
                href={home.resume?.url}
                className="inline-flex items-center gap-2 rounded-full border border-[#cad9d5] px-6 py-3.5 text-sm font-semibold text-[#253b3e] transition hover:border-[#21b995] hover:text-[#168e78] dark:border-white/20 dark:text-white/80 dark:hover:text-[#5be0bf]"
              >
                Download CV <span aria-hidden="true">↗</span>
              </PortfolioFileLink>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#758486] dark:text-white/45">
              {skills.slice(0, 4).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[27rem] md:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -right-5 -top-5 h-28 w-28 rounded-[2rem] bg-[#c4f1e4] dark:bg-[#1b5148]"
            />
            <div className="relative rounded-[2rem] border border-[#dce7e4] bg-white p-3 shadow-[0_28px_70px_rgba(13,40,43,0.12)] dark:border-white/10 dark:bg-[#102127]">
              <PortfolioImage
                url={home.photo?.url}
                alt={`${home.name} profile`}
                fallbackText={initials}
                className="aspect-[4/4.7] w-full rounded-[1.45rem]"
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/10 bg-[#0b1c22]/90 px-5 py-4 text-white shadow-xl backdrop-blur-md">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#69dfc1]">
                  Based in
                </p>
                <p className="mt-1 text-sm font-medium">{location}</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-2xl border border-[#dce7e4] bg-white px-4 py-3 shadow-lg dark:border-white/10 dark:bg-[#102127] sm:block">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#859391] dark:text-white/45">
                Focus
              </p>
              <p className="mt-1 text-sm font-semibold text-[#183138] dark:text-white">
                Build · Integrate · Improve
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e3ece8] bg-white dark:border-white/10 dark:bg-[#0d1d23]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#e3ece8] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8 dark:divide-white/10">
          {statistics.map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 py-6 sm:px-7 sm:py-7 first:sm:pl-0 last:sm:pr-0">
              <span className="text-3xl font-semibold tracking-tight text-[#168e78] dark:text-[#5be0bf]">
                {String(stat.value).padStart(2, "0")}
              </span>
              <span className="max-w-28 text-xs leading-5 text-[#6e7c7e] dark:text-white/55">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
              What I work on
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
              Practical solutions, thoughtfully built.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-[#68797c] dark:text-white/60">
              A mix of product-focused development, integrations, and business
              systems work.
            </p>
            <Link
              href="/about"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#168e78] hover:text-[#0d5f51] dark:text-[#5be0bf]"
            >
              More about me <ArrowIcon />
            </Link>
          </div>

          <div className="space-y-3">
            {skillTracks.map((track) => {
              const trackSkills = track.matches.filter((skill) =>
                skills.includes(skill),
              );
              return (
                <article
                  key={track.number}
                  className="group grid gap-3 rounded-2xl border border-[#dce7e4] bg-white p-5 transition hover:border-[#8ddbc8] hover:bg-[#f8fcfa] sm:grid-cols-[3rem_1fr] sm:gap-5 sm:p-6 dark:border-white/10 dark:bg-[#102127] dark:hover:border-[#4ed8b6]/50 dark:hover:bg-[#122a2f]"
                >
                  <span className="pt-1 text-xs font-semibold tracking-widest text-[#21a387] dark:text-[#5be0bf]">
                    {track.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[#183037] dark:text-white">
                      {track.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#68797c] dark:text-white/60">
                      {track.description}
                    </p>
                    {trackSkills.length > 0 && (
                      <p className="mt-3 text-xs leading-5 text-[#738482] dark:text-white/45">
                        {trackSkills.join(" · ")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
                <PortfolioCard key={project.id} item={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
              The journey
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#122126] dark:text-white sm:text-4xl">
              Experience shaped by real-world work.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {experience.slice(0, 2).map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127] sm:p-8"
              >
                <p className="text-xs font-medium text-[#168e78] dark:text-[#5be0bf]">
                  {item.date}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[#183037] dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-[#69797b] dark:text-white/50">
                  {item.organization}
                </p>
                <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-[#68797c] dark:text-white/60">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
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
                  Training and certifications.
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

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#102a30] px-6 py-12 text-white sm:px-10 md:px-14 md:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-[#5be0bf]/20"
          />
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-20 h-56 w-56 rounded-full border border-[#5be0bf]/20"
          />
          <div className="relative max-w-2xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#68e0c1]">
              Let&apos;s connect
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              Have a challenge worth solving?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              I&apos;m always glad to connect about software, ideas, and
              opportunities to build something useful.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#55dbb9] px-6 py-3.5 text-sm font-semibold text-[#08221f] transition hover:bg-[#8aefd6]"
            >
              Get in touch <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
