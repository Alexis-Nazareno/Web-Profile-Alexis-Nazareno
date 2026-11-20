"use client";

import Link from "next/link";
import { usePortfolio } from "../components/PortfolioProvider";
import SectionHeading from "../components/SectionHeading";

export default function AboutPage() {
  const { home, about, experience } = usePortfolio();
  const details = [
    ["Current role", about.position],
    ["Education", about.education],
    ["Location", about.location],
  ].filter(([, value]) => value);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <SectionHeading
        eyebrow="A little about me"
        title={`People, problems, and purposeful software.`}
        description={`I’m ${home.name}. ${about.position ? `${about.position}.` : ""}`}
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <article className="rounded-[1.5rem] border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127] sm:p-9">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#168e78] dark:text-[#5be0bf]">
            My perspective
          </p>
          <p className="whitespace-pre-wrap text-base leading-8 text-[#4f6266] dark:text-white/70">
            {about.bio}
          </p>
          {details.length > 0 && (
            <dl className="mt-8 grid gap-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-[#f2f7f5] p-4 dark:bg-white/5"
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

        {about.skills?.length > 0 && (
          <aside className="rounded-[1.5rem] bg-[#102a30] p-6 text-white sm:p-9">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#68e0c1]">
              Tools &amp; skills
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              The toolkit I bring to the work.
            </h2>
            <ul className="mt-7 flex flex-wrap gap-2">
              {about.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

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
          <div className="relative ml-2 border-l border-[#b8d9cf] pl-7 dark:border-white/15 sm:ml-4 sm:pl-10">
            {experience.map((item) => (
              <article key={item.id} className="relative pb-10 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[2.13rem] top-1.5 h-3 w-3 rounded-full border-[3px] border-[#f7faf9] bg-[#23a98c] dark:border-[#09171d] sm:-left-[2.88rem]"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-semibold text-[#1a3035] dark:text-white">
                    {item.title}
                  </h3>
                  {item.date && (
                    <span className="text-xs font-medium text-[#168e78] dark:text-[#5be0bf]">
                      {item.date}
                    </span>
                  )}
                </div>
                {item.organization && (
                  <p className="mt-1 text-sm font-medium text-[#637578] dark:text-white/55">
                    {item.organization}
                  </p>
                )}
                {item.description && (
                  <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#68797c] dark:text-white/65">
                    {item.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
