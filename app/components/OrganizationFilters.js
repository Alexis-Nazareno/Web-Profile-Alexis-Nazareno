"use client";

import { useState } from "react";

export function useOrganizationFilter(items) {
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const organizations = new Map();
  const entries = items.map((item, index) => {
    const name = typeof item.organization === "string" ? item.organization.trim() : "";
    const key = name.toLocaleLowerCase();
    if (!organizations.has(key)) organizations.set(key, name || "No organization");
    return { item, number: index + 1, organizationKey: key };
  });
  const activeOrganization = organizations.has(selectedOrganization) ? selectedOrganization : null;
  const visibleEntries = activeOrganization === null
    ? entries
    : entries.filter((entry) => entry.organizationKey === activeOrganization);
  return { organizations, activeOrganization, setSelectedOrganization, visibleEntries };
}

export default function OrganizationFilters({ headingId, heading, allLabel, groupLabel, total, filter }) {
  const { organizations, activeOrganization, setSelectedOrganization, visibleEntries } = filter;
  const buttonClass = (active) =>
    `min-h-10 max-w-full break-words rounded-full border px-4 py-2 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:focus-visible:outline-[#5be0bf] ${active ? "border-[#168e78] bg-[#168e78] text-white dark:border-[#5be0bf] dark:bg-[#5be0bf] dark:text-[#102127]" : "border-[#cbded7] bg-white text-[#48635b] hover:border-[#168e78] dark:border-white/15 dark:bg-white/5 dark:text-white/75 dark:hover:border-[#5be0bf]"}`;

  return (
    <div className="flex flex-col gap-5 border-b border-[#dce7e4] pb-6 dark:border-white/10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#168e78] dark:text-[#5be0bf]">The collection</p>
          <h2 id={headingId} className="mt-2 text-2xl font-semibold tracking-tight text-[#183037] dark:text-white">{heading}</h2>
        </div>
        <p aria-live="polite" className="text-sm text-[#65777a] dark:text-white/60">
          Showing {visibleEntries.length} of {total}
        </p>
      </div>
      <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={activeOrganization === null} onClick={() => setSelectedOrganization(null)} className={buttonClass(activeOrganization === null)}>
          {allLabel}
        </button>
        {[...organizations].map(([key, name]) => (
          <button key={key} type="button" aria-pressed={activeOrganization === key} onClick={() => setSelectedOrganization(key)} className={buttonClass(activeOrganization === key)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
