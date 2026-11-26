export function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[#dce7e4] motion-safe:animate-pulse dark:bg-white/10 ${className}`}
    />
  );
}

function PageSkeleton({ children }) {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      aria-busy="true"
    >
      <span className="sr-only">Loading page content...</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function PageHeadingSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-36" />
      <SkeletonBlock className="mt-4 h-10 w-3/4 max-w-xl" />
      <SkeletonBlock className="mt-4 h-4 w-full max-w-2xl" />
      <SkeletonBlock className="mt-2 h-4 w-4/5 max-w-xl" />
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#dce7e4] bg-white p-5 dark:border-white/10 dark:bg-[#102127]">
      <SkeletonBlock className="aspect-[16/10] w-full rounded-xl" />
      <SkeletonBlock className="mt-5 h-5 w-3/4" />
      <SkeletonBlock className="mt-3 h-3 w-full" />
      <SkeletonBlock className="mt-2 h-3 w-5/6" />
      <SkeletonBlock className="mt-5 h-3 w-2/5" />
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <header
      aria-hidden="true"
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0a171d]/95 text-white"
    >
      <div className="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between gap-5 px-5 md:px-8">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-xl bg-white/10 dark:bg-white/10" />
          <div>
            <SkeletonBlock className="h-3 w-32 bg-white/15 dark:bg-white/15" />
            <SkeletonBlock className="mt-2 h-2 w-24 bg-white/10 dark:bg-white/10" />
          </div>
        </div>
        <div className="hidden items-center gap-6 lg:flex">
          <SkeletonBlock className="h-3 w-12 bg-white/10 dark:bg-white/10" />
          <SkeletonBlock className="h-3 w-14 bg-white/10 dark:bg-white/10" />
          <SkeletonBlock className="h-3 w-16 bg-white/10 dark:bg-white/10" />
          <SkeletonBlock className="h-9 w-24 rounded-full bg-white/10 dark:bg-white/10" />
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <SkeletonBlock className="h-10 w-10 rounded-full bg-white/10 dark:bg-white/10" />
          <SkeletonBlock className="h-10 w-10 rounded-full bg-white/10 dark:bg-white/10" />
        </div>
      </div>
    </header>
  );
}

export function FooterSkeleton() {
  return (
    <footer
      aria-hidden="true"
      className="bg-[#0a171d] px-5 py-10 md:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <SkeletonBlock className="h-3 w-40 bg-white/10 dark:bg-white/10" />
        <SkeletonBlock className="mt-4 h-8 w-72 max-w-full bg-white/15 dark:bg-white/15" />
        <SkeletonBlock className="mt-4 h-3 w-full max-w-sm bg-white/10 dark:bg-white/10" />
      </div>
    </footer>
  );
}

export function HomeSkeleton() {
  return (
    <PageSkeleton>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:items-center md:gap-14 md:px-8 md:py-24 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <SkeletonBlock className="h-3 w-40" />
          <SkeletonBlock className="mt-10 h-4 w-20" />
          <SkeletonBlock className="mt-4 h-12 w-4/5 sm:h-16" />
          <SkeletonBlock className="mt-6 h-6 w-2/5" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-xl" />
          <SkeletonBlock className="mt-2 h-4 w-4/5 max-w-xl" />
          <div className="mt-8 flex gap-3">
            <SkeletonBlock className="h-12 w-36 rounded-full" />
            <SkeletonBlock className="h-12 w-32 rounded-full" />
          </div>
        </div>
        <SkeletonBlock className="order-first mx-auto aspect-[4/4.7] w-full max-w-[27rem] rounded-[2rem] sm:order-none" />
      </section>

      <section className="border-y border-[#e3ece8] dark:border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#e3ece8] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:px-8 dark:divide-white/10">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex min-h-24 items-center justify-center gap-4 px-4 py-5 sm:px-7 sm:py-6"
            >
              <SkeletonBlock className="h-9 w-12" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <PageHeadingSkeleton />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <ProjectCardSkeleton key={item} />
          ))}
        </div>
      </section>
    </PageSkeleton>
  );
}

export function ProjectsSkeleton() {
  return (
    <PageSkeleton>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <PageHeadingSkeleton />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <ProjectCardSkeleton key={item} />
          ))}
        </div>
      </section>
    </PageSkeleton>
  );
}

export function AchievementsSkeleton() {
  return (
    <PageSkeleton>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <PageHeadingSkeleton />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127]"
            >
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <SkeletonBlock className="h-3 w-2/3" />
                  <SkeletonBlock className="mt-2 h-3 w-1/2" />
                </div>
              </div>
              <SkeletonBlock className="mt-7 h-5 w-4/5" />
              <SkeletonBlock className="mt-4 h-3 w-full" />
              <SkeletonBlock className="mt-2 h-3 w-5/6" />
              <SkeletonBlock className="mt-7 h-3 w-2/5" />
            </div>
          ))}
        </div>
      </section>
    </PageSkeleton>
  );
}

export function AboutSkeleton() {
  return (
    <PageSkeleton>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <PageHeadingSkeleton />
        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div className="rounded-[1.5rem] border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127] sm:p-9">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-6 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-5/6" />
            <SkeletonBlock className="mt-3 h-4 w-4/5" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonBlock key={item} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-[#102a30] p-6 sm:p-9">
            <SkeletonBlock className="h-3 w-28 bg-white/10 dark:bg-white/10" />
            <SkeletonBlock className="mt-5 h-7 w-4/5 bg-white/15 dark:bg-white/15" />
            <div className="mt-7 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="h-8 w-20 rounded-full bg-white/10 dark:bg-white/10"
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-20">
          <PageHeadingSkeleton />
          <div className="mt-10 space-y-8 border-l border-[#b8d9cf] pl-7 dark:border-white/15 sm:pl-10">
            {[0, 1, 2].map((item) => (
              <div key={item}>
                <SkeletonBlock className="h-5 w-2/5" />
                <SkeletonBlock className="mt-3 h-3 w-1/4" />
                <SkeletonBlock className="mt-5 h-3 w-full max-w-3xl" />
                <SkeletonBlock className="mt-2 h-3 w-5/6 max-w-3xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageSkeleton>
  );
}

export function ContactSkeleton() {
  return (
    <PageSkeleton>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <div>
          <PageHeadingSkeleton />
          <SkeletonBlock className="mt-8 h-12 w-32 rounded-full" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127]"
            >
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="mt-4 h-5 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    </PageSkeleton>
  );
}
