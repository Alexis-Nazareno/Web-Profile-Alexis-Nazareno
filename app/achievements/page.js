"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { usePortfolio } from "../components/PortfolioProvider";
import CollectionHeader from "../components/CollectionHeader";
import OrganizationFilters, { useOrganizationFilter } from "../components/OrganizationFilters";
import PortfolioImage from "../components/PortfolioImage";
import RichTextContent from "../components/RichTextContent";
import { AchievementsSkeleton } from "../components/PortfolioSkeleton";
import { sortTrainingByDate } from "../../lib/trainingDates.mjs";

function TrainingCard({ item }) {
  const [flipped, setFlipped] = useState(false);
  const frontButtonRef = useRef(null);
  const descriptionRef = useRef(null);
  const interactedRef = useRef(false);
  const descriptionId = useId();
  const images = Array.isArray(item.images) ? item.images : [];

  useLayoutEffect(() => {
    if (interactedRef.current) {
      (flipped ? descriptionRef : frontButtonRef).current?.focus();
    }
  }, [flipped]);

  function toggleCard() {
    interactedRef.current = true;
    setFlipped((current) => !current);
  }

  function handleBackClick(event) {
    if (event.target.closest("a, button, input, select, textarea")) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) return;
    const scrollArea = descriptionRef.current;
    if (scrollArea) {
      const scrollbarWidth = scrollArea.offsetWidth - scrollArea.clientWidth;
      const rect = scrollArea.getBoundingClientRect();
      if (scrollbarWidth > 0 && event.clientX >= rect.right - scrollbarWidth && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return;
    }
    toggleCard();
  }

  return (
    <article className={`training-flip-card min-w-0 ${flipped ? "is-flipped" : ""}`}>
      <div className="training-flip-inner">
        <div aria-hidden={flipped} inert={flipped} className="training-flip-front group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition-[border-color,box-shadow] duration-300 hover:border-[#65c9a9] hover:shadow-[0_18px_40px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#4bc9a4] via-[#a5e5ce] to-transparent opacity-70" />
          {images.length > 0 ? (
            <div className={`grid aspect-[1.8/1] shrink-0 grid-cols-2 gap-1 overflow-hidden bg-[#e8f1ee] dark:bg-[#183037] ${images.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}>
              {images.slice(0, 4).map((image, index) => (
                <PortfolioImage
                  key={image.publicId || image.id || image.url}
                  url={image.url}
                  alt={`${item.title}, image ${index + 1}`}
                  objectFit="contain"
                  className={`min-h-0 min-w-0 ${images.length === 1 ? "col-span-2" : images.length === 3 && index === 0 ? "row-span-2" : ""}`}
                />
              ))}
            </div>
          ) : (
            <div aria-hidden="true" className="relative flex aspect-[1.8/1] shrink-0 items-end overflow-hidden bg-gradient-to-br from-[#e7f7f0] via-[#dff2e9] to-[#d4eee4] p-5 dark:from-[#173d36] dark:via-[#123a31] dark:to-[#102127]">
              <div className="absolute -right-8 -top-20 h-56 w-56 rounded-full border border-[#2cae91]/20" />
              <div className="absolute -right-2 -top-14 h-44 w-44 rounded-full border border-[#2cae91]/20" />
              <span className="relative rounded-full border border-[#a5d9cd] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#236c5d] dark:border-white/15 dark:bg-[#102127]/80 dark:text-[#83ddc7]">
                Learning & credentials
              </span>
            </div>
          )}
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 flex-1 break-words text-[10px] font-semibold uppercase leading-5 tracking-[0.16em] text-[#168e78] dark:text-[#5be0bf]">
                  {typeof item.organization === "string" && item.organization.trim() ? item.organization : "Learning & credentials"}
                </p>
                {item.date && (
                  <p className="max-w-1/2 min-w-0 break-words text-right text-xs font-medium leading-5 text-[#748b83] dark:text-white/60">{item.date}</p>
                )}
              </div>
              <h3 className="mt-3 break-words text-xl font-semibold leading-snug tracking-tight text-[#183037] dark:text-white">
                {item.title}
              </h3>
              {item.technologies?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {item.technologies.map((technology) => (
                    <li key={technology} className="rounded-full bg-[#f0f5f3] px-3 py-1 text-xs text-[#48635f] dark:bg-white/5 dark:text-white/65">{technology}</li>
                  ))}
                </ul>
              )}
            </div>
            {item.description && (
              <>
                <div aria-hidden="true" className="mt-auto pt-6">
                  <span className="inline-flex items-center gap-2 border-b border-[#a5d9cd] pb-1 text-sm font-semibold text-[#168e78] transition-colors group-hover:border-[#168e78] motion-reduce:transition-none dark:border-[#3c7869] dark:text-[#5be0bf] dark:group-hover:border-[#5be0bf]">
                    View description
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                      <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <button ref={frontButtonRef} type="button" onClick={toggleCard} aria-label={`View description for ${item.title}`} aria-expanded={flipped} aria-controls={descriptionId} className="absolute inset-0 z-20 cursor-pointer rounded-2xl focus-visible:outline-offset-[-4px]" />
              </>
            )}
          </div>
        </div>
        {item.description && (
          <div id={descriptionId} aria-hidden={!flipped} inert={!flipped} onClick={handleBackClick} className="training-flip-back absolute inset-0 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#9bdcc8] bg-[#f3fbf7] p-6 shadow-[0_12px_30px_rgba(16,54,48,0.06)] sm:p-7 dark:border-[#2d705f] dark:bg-[#102a27]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4bc9a4] via-[#a5e5ce] to-transparent" />
            <div ref={descriptionRef} tabIndex={0} role="region" aria-label={`Description for ${item.title}. Press Enter or Escape to return to the card.`} onKeyDown={(event) => {
              if (event.target === event.currentTarget && (event.key === "Enter" || event.key === "Escape")) {
                event.preventDefault();
                toggleCard();
              }
            }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
              <RichTextContent content={item.description} className="whitespace-pre-wrap break-words text-sm leading-7 text-[#526d67] dark:text-white/75" />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

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
            {filter.visibleEntries.map(({ item }) => (
              <TrainingCard key={item.id} item={item} />
            ))}
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
