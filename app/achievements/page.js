"use client";

import { usePortfolio } from "../components/PortfolioProvider";
import CollectionHeader from "../components/CollectionHeader";
import OrganizationFilters, { useOrganizationFilter } from "../components/OrganizationFilters";
import PortfolioImage from "../components/PortfolioImage";
import RichTextContent from "../components/RichTextContent";
import { AchievementsSkeleton } from "../components/PortfolioSkeleton";
import { sortTrainingByDate } from "../../lib/trainingDates.mjs";

export default function AchievementsPage() {
  const { achievements, loading } = usePortfolio();
  const filter = useOrganizationFilter(sortTrainingByDate(achievements));

  if (loading) return <AchievementsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <CollectionHeader
        eyebrow="Learning & growth"
        title="Learning that shapes my work."
        description="Courses and certifications that help me grow as a software engineer and build better solutions."
        count={achievements.length}
        countLabel={achievements.length === 1 ? "course or certificate" : "courses and certificates"}
      />
      {achievements.length ? (
        <section className="mt-10 sm:mt-12" aria-labelledby="training-heading">
          <OrganizationFilters
            headingId="training-heading"
            heading="My training and certificates"
            allLabel="All training"
            groupLabel="Filter training and certificates by organization"
            total={achievements.length}
            filter={filter}
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filter.visibleEntries.map(({ item, number }) => {
              const images = Array.isArray(item.images) ? item.images : [];
              return (
                <article key={item.id} className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#dce7e4] bg-white shadow-[0_8px_24px_rgba(27,79,63,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[#a7d7c6] hover:shadow-[0_14px_32px_rgba(27,79,63,0.09)] motion-safe:hover:-translate-y-1 motion-reduce:transition-none dark:border-white/10 dark:bg-[#102127] dark:hover:border-[#5be0bf]/35">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#4bc9a4] via-[#a5e5ce] to-transparent opacity-70" />
                  {images.length > 0 && (
                    <div className="grid aspect-[1.8/1] grid-cols-2 gap-1 overflow-hidden bg-[#e8f1ee] dark:bg-[#183037]">
                      {images.slice(0, 3).map((image, index) => (
                        <PortfolioImage
                          key={image.publicId || image.id || image.url}
                          url={image.url}
                          alt={`${item.title}, image ${index + 1}`}
                          className={`min-h-0 min-w-0 ${images.length === 1 ? "col-span-2" : images.length > 2 && index === 0 ? "row-span-2" : ""}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <p className="min-w-0 break-words text-[10px] font-semibold uppercase leading-5 tracking-[0.16em] text-[#168e78] dark:text-[#5be0bf]">
                        {typeof item.organization === "string" && item.organization.trim() ? item.organization : "Learning & credentials"}
                      </p>
                      <span aria-hidden="true" className="shrink-0 font-mono text-xs font-medium tabular-nums text-[#91b2a7] dark:text-[#7aa59a]">
                        {String(number).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words text-xl font-semibold leading-snug tracking-tight text-[#183037] dark:text-white">
                      {item.title}
                    </h3>
                    {item.date && (
                      <p className="mt-2 text-xs font-medium text-[#748b83] dark:text-white/50">{item.date}</p>
                    )}
                    {item.description && (
                      <RichTextContent content={item.description} className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#65777a] dark:text-white/65" />
                    )}
                    {item.technologies?.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {item.technologies.map((technology) => (
                          <li key={technology} className="rounded-full bg-[#f0f5f3] px-3 py-1 text-xs text-[#48635f] dark:bg-white/5 dark:text-white/65">{technology}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No published training or certificates yet.
        </p>
      )}
    </div>
  );
}
