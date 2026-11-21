import SectionHeading from "./SectionHeading";

export default function CollectionHeader({ eyebrow, title, description, count, countLabel }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#cce5db] bg-gradient-to-br from-[#eef9f4] via-[#f8fcfa] to-[#e6f4ef] px-6 py-9 dark:border-white/10 dark:from-[#163a35] dark:via-[#102b2b] dark:to-[#102127] sm:px-10 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full border border-[#168e78]/10 dark:border-[#5be0bf]/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-8 h-40 w-40 rounded-full border border-[#168e78]/10 dark:border-[#5be0bf]/10" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        {count > 0 && (
          <div className="flex w-fit shrink-0 items-center gap-4 rounded-2xl border border-[#b9ddd0] bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
            <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-[#d7f0e5] text-[#168e78] dark:bg-[#5be0bf]/10 dark:text-[#5be0bf]">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20.5c-2-1.6-4.8-2.2-8-1.7V5.3c3.2-.5 6 .1 8 1.7m0 13.5c2-1.6 4.8-2.2 8-1.7V5.3c-3.2-.5-6 .1-8 1.7m0 13.5V7" />
              </svg>
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums text-[#183d36] dark:text-white">{count}</p>
              <p className="text-xs text-[#607870] dark:text-white/60">{countLabel}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
