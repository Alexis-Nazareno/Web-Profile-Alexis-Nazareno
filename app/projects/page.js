"use client";

import { usePortfolio } from "../components/PortfolioProvider";
import PortfolioCard from "../components/PortfolioCard";
import SectionHeading from "../components/SectionHeading";
import { ProjectsSkeleton } from "../components/PortfolioSkeleton";

export default function ProjectsPage() {
  const { projects, loading } = usePortfolio();
  if (loading) return <ProjectsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <SectionHeading
        eyebrow="Selected work"
        title="Projects built around real needs."
        description="A selection of product, web, and integration work. Each project reflects a different problem, team, and set of constraints."
      />
      {projects.length ? (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PortfolioCard key={project.id} item={project} />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          Wala pang naka-publish na projects.
        </p>
      )}
    </div>
  );
}
