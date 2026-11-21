"use client";

import { usePortfolio } from "../components/PortfolioProvider";
import PortfolioCard from "../components/PortfolioCard";
import SectionHeading from "../components/SectionHeading";
import { AchievementsSkeleton } from "../components/PortfolioSkeleton";

export default function AchievementsPage() {
  const { achievements, loading } = usePortfolio();
  if (loading) return <AchievementsSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <SectionHeading
        eyebrow="Learning & growth"
        title="Training and certifications."
        description="A record of continued learning across software development, cloud platforms, security, and modern engineering practices."
      />
      {achievements.length ? (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <PortfolioCard
              key={achievement.id}
              item={achievement}
              kind="achievement"
            />
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No published training or certificates yet.
        </p>
      )}
    </div>
  );
}
