"use client";

import RichTextContent from "../components/RichTextContent";
import SectionHeading from "../components/SectionHeading";
import usePublishedWork from "../components/usePublishedWork";

export default function WorkLessonsPage() {
  const { items, loading, error } = usePublishedWork("publicLessons");

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <SectionHeading
        eyebrow="Beyond work"
        title="Lessons that stay with me."
        description="Thoughts on work etiquette, adapting to new environments, and the people and experiences I appreciate."
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
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[#dce7e4] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#102127] sm:p-7">
              {item.organization && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#168e78] dark:text-[#5be0bf]">
                  {item.organization}
                </p>
              )}
              <h2 className="text-xl font-semibold text-[#183037] dark:text-white">
                {item.title}
              </h2>
              {item.description && (
                <RichTextContent
                  content={item.description}
                  className="mt-4 text-sm leading-7 text-[#65777a] dark:text-white/65"
                />
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No work lessons have been published yet.
        </p>
      )}
    </div>
  );
}
