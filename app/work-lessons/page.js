"use client";

import RichTextContent from "../components/RichTextContent";
import CollectionHeader from "../components/CollectionHeader";
import OrganizationFilters, { useOrganizationFilter } from "../components/OrganizationFilters";
import usePublishedWork from "../components/usePublishedWork";

export default function WorkLessonsPage() {
  const { items, loading, error } = usePublishedWork("publicLessons");
  const filter = useOrganizationFilter(items);

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <CollectionHeader
        eyebrow="Beyond work · Field notes"
        title="Lessons that stay with me."
        description="Thoughts on work etiquette, adapting to new environments, and the people and experiences I appreciate."
        count={!loading && !error ? items.length : 0}
        countLabel={items.length === 1 ? "lesson collected" : "lessons collected"}
      />
      {loading ? (
        <p role="status" className="mt-12 text-sm text-[#65777a] dark:text-white/60">
          Loading work lessons...
        </p>
      ) : error ? (
        <p role="alert" className="mt-12 rounded-2xl border border-[#efb2ad] bg-[#fff2f0] p-5 text-sm text-[#9f3026] dark:border-[#783c39] dark:bg-[#3a2020] dark:text-[#ffb9b2]">
          {error}
        </p>
      ) : items.length ? (
        <section className="mt-10 sm:mt-12" aria-labelledby="lessons-heading">
          <OrganizationFilters
            headingId="lessons-heading"
            heading="Explore the lessons"
            allLabel="All lessons"
            groupLabel="Filter lessons by organization"
            total={items.length}
            filter={filter}
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filter.visibleEntries.map(({ item, number }) => (
              <article key={item.id} className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#dce7e4] bg-white p-6 shadow-[0_8px_24px_rgba(27,79,63,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[#a7d7c6] hover:shadow-[0_14px_32px_rgba(27,79,63,0.09)] motion-safe:hover:-translate-y-1 motion-reduce:transition-none dark:border-white/10 dark:bg-[#102127] dark:hover:border-[#5be0bf]/35 sm:p-7">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4bc9a4] via-[#a5e5ce] to-transparent opacity-70" />
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 break-words text-[10px] font-semibold uppercase leading-5 tracking-[0.16em] text-[#168e78] dark:text-[#5be0bf]">
                    {typeof item.organization === "string" && item.organization.trim() ? item.organization : "Work lesson"}
                  </p>
                  <span aria-hidden="true" className="shrink-0 font-mono text-xs font-medium tabular-nums text-[#91b2a7] dark:text-[#7aa59a]">
                    {String(number).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 break-words text-xl font-semibold leading-snug tracking-tight text-[#183037] dark:text-white">
                  {item.title}
                </h3>
                {item.description && (
                  <RichTextContent
                    content={item.description}
                    className="mt-4 break-words text-sm leading-7 text-[#65777a] dark:text-white/65"
                  />
                )}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No work lessons have been published yet.
        </p>
      )}
    </div>
  );
}
