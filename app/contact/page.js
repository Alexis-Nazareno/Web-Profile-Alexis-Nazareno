"use client";

import { usePortfolio } from "../components/PortfolioProvider";
import SectionHeading from "../components/SectionHeading";

export default function ContactPage() {
  const { home, contact } = usePortfolio();

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
      <div>
        <SectionHeading
          eyebrow="Start a conversation"
          title="Have something in mind?"
          description={`I’m ${home.name}. Reach out about an opportunity, a project, or just to connect.`}
        />
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#0f292d] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#16443f] dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
          >
            Email me <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <div className="space-y-3">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="block rounded-2xl border border-[#dce7e4] bg-white p-6 transition hover:border-[#8ddbc8] dark:border-white/10 dark:bg-[#102127] dark:hover:border-[#4ed8b6]/50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#168e78] dark:text-[#5be0bf]">
              Email
            </p>
            <p className="mt-2 break-all text-base font-medium text-[#1b3338] dark:text-white">
              {contact.email}
            </p>
          </a>
        )}
        {contact.location && (
          <div className="rounded-2xl border border-[#dce7e4] bg-white p-6 dark:border-white/10 dark:bg-[#102127]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#168e78] dark:text-[#5be0bf]">
              Location
            </p>
            <p className="mt-2 text-base font-medium text-[#1b3338] dark:text-white">
              {contact.location}
            </p>
          </div>
        )}
        {contact.website && (
          <a
            href={contact.website}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-[#dce7e4] bg-white p-6 transition hover:border-[#8ddbc8] dark:border-white/10 dark:bg-[#102127] dark:hover:border-[#4ed8b6]/50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#168e78] dark:text-[#5be0bf]">
              Website
            </p>
            <p className="mt-2 break-all text-base font-medium text-[#1b3338] dark:text-white">
              {contact.website}
            </p>
          </a>
        )}
      </div>
    </div>
  );
}
