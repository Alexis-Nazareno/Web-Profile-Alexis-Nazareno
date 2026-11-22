"use client";

import PortfolioImage from "./PortfolioImage";
import RichTextContent from "./RichTextContent";

export default function PortfolioCard({ item, kind = "project" }) {
  const images = item.images || [];
  const isProject = kind === "project";

  return (
    <article className="group overflow-hidden rounded-[1.4rem] border border-[#9bdcc8] bg-gradient-to-br from-[#f7fffc] via-white to-[#eaf8f2] shadow-[0_12px_30px_rgba(16,54,48,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#65c9a9] hover:shadow-[0_18px_42px_rgba(16,54,48,0.12)] dark:border-[#2d705f] dark:from-[#123a31] dark:via-[#102127] dark:to-[#0d2024] dark:hover:border-[#4ed8b6]/60 dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.25)]">
      {images.length > 0 ? (
        <div className="grid aspect-[1.8/1] grid-cols-2 gap-1 overflow-hidden bg-[#e8f1ee] dark:bg-[#183037]">
          {images.slice(0, 3).map((image, index) => (
            <PortfolioImage
              key={image.publicId || image.id || image.url}
              url={image.url}
              alt={`${item.title}, image ${index + 1}`}
              className={`min-h-0 min-w-0 ${
                images.length === 1
                  ? "col-span-2"
                  : images.length > 2 && index === 0
                    ? "row-span-2"
                    : ""
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="relative flex aspect-[1.8/1] items-end overflow-hidden bg-gradient-to-br from-[#e7f7f0] via-[#dff2e9] to-[#d4eee4] p-5 dark:from-[#173d36] dark:via-[#123a31] dark:to-[#102127]">
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-20 h-56 w-56 rounded-full border border-[#2cae91]/20"
          />
          <div
            aria-hidden="true"
            className="absolute -right-2 -top-14 h-44 w-44 rounded-full border border-[#2cae91]/20"
          />
          <span className="relative rounded-full border border-[#a5d9cd] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#236c5d] dark:border-white/15 dark:bg-[#102127]/80 dark:text-[#83ddc7]">
            {isProject ? "Selected work" : "Learning & credentials"}
          </span>
        </div>
      )}

      <div className="p-6 sm:p-7">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b7b7f] dark:text-white/50">
          {item.date && <span>{item.date}</span>}
          {item.date && item.organization && <span aria-hidden="true">/</span>}
          {item.organization && <span>{item.organization}</span>}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[#122126] transition group-hover:text-[#168e78] dark:text-white dark:group-hover:text-[#5be0bf]">
          {item.title}
        </h2>
        {item.description && (
          <RichTextContent
            content={item.description}
            className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#66777b] dark:text-white/65"
          />
        )}
        {item.technologies?.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {item.technologies.map((technology) => (
              <li
                key={technology}
                className="rounded-full bg-[#f0f5f3] px-3 py-1 text-xs text-[#48635f] dark:bg-white/5 dark:text-white/65"
              >
                {technology}
              </li>
            ))}
          </ul>
        )}
        {isProject && (item.liveUrl || item.sourceUrl) && (
          <div className="mt-6 flex flex-wrap gap-5 border-t border-[#e7eeeb] pt-4 text-sm font-semibold dark:border-white/10">
            {item.liveUrl && (
              <a
                href={item.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#168e78] hover:text-[#0e5e50] dark:text-[#5be0bf] dark:hover:text-white"
              >
                Live project <span aria-hidden="true">↗</span>
              </a>
            )}
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#65777a] hover:text-[#168e78] dark:text-white/65 dark:hover:text-[#5be0bf]"
              >
                Source code <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
