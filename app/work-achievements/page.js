"use client";

import CollectionHeader from "../components/CollectionHeader";
import OrganizationFilters, { useOrganizationFilter } from "../components/OrganizationFilters";
import PortfolioFileLink from "../components/PortfolioFileLink";
import { AchievementsSkeleton } from "../components/PortfolioSkeleton";
import { usePortfolio } from "../components/PortfolioProvider";
import RichTextContent from "../components/RichTextContent";
import { sortTrainingByDate } from "../../lib/trainingDates.mjs";

export default function WorkAchievementsPage() {
  const { workAchievements, loading } = usePortfolio();
  const documents = sortTrainingByDate(
    workAchievements.filter((item) => item.document?.url),
  );
  const filter = useOrganizationFilter(documents);

  if (loading) return <AchievementsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <CollectionHeader
        eyebrow="Beyond work · Learning & growth"
        title="Work achievements."
        description="A collection of milestones and achievements from my work journey."
        count={documents.length}
        countLabel={documents.length === 1 ? "document" : "documents"}
      />
      {documents.length ? (
        <section className="mt-10 sm:mt-12" aria-labelledby="achievements-heading">
          <OrganizationFilters
            headingId="achievements-heading"
            heading="My documents"
            allLabel="All documents"
            groupLabel="Filter documents by organization"
            total={documents.length}
            filter={filter}
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filter.visibleEntries.map(({ item, number }) => (
              <article key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <p className="break-words text-[10px] font-semibold uppercase leading-5 tracking-[0.16em] text-[#168e78] dark:text-[#5be0bf]">
                    {item.organization?.trim() || "Learning & credentials"}
                  </p>
                  <span aria-hidden="true" className="shrink-0 font-mono text-xs text-[#91b2a7] dark:text-[#7aa59a]">
                    {String(number).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 break-words text-xl font-semibold leading-snug text-[#183037] dark:text-white">{item.title}</h3>
                {item.date && <p className="mt-2 text-xs text-[#748b83] dark:text-white/50">{item.date}</p>}
                {item.description && <RichTextContent content={item.description} className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#65777a] dark:text-white/65" />}
                <PortfolioFileLink href={item.document.url} className="mt-6 w-fit rounded-lg bg-[#168e78] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:bg-[#4ed8b6] dark:text-[#09201e]">
                  Open document <span className="sr-only">for {item.title} (opens in a new tab)</span> ↗
                </PortfolioFileLink>
                <p className="mt-2 break-all text-xs text-[#65777a] dark:text-white/50">{item.document.name}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No work achievement documents have been published yet.
        </p>
      )}
    </div>
  );
}
