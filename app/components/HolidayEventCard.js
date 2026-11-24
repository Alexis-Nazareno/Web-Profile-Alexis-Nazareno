"use client";

import { useEffect, useId, useRef, useState } from "react";
import PortfolioImage from "./PortfolioImage";
import { formatManilaSchedule, getHighlightSchedule } from "../../lib/highlightSchedule.mjs";

const monthFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", month: "short" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", day: "numeric" });

function ExpandableEventText({ text, label, className }) {
  const textRef = useRef(null);
  const textId = useId();
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const element = textRef.current;
    if (!element || !ready || expanded) return undefined;

    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
    measure();
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [text, ready, expanded]);

  return (
    <div className={className}>
      <p id={textId} ref={textRef} className={`whitespace-pre-wrap break-words ${ready && !expanded ? "line-clamp-4" : ""} ${expanded ? "animate-event-text-reveal" : ""}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          aria-label={`${expanded ? "Show less" : "Read more"} ${label}`}
          onClick={() => setExpanded((current) => !current)}
          className="group/event-disclosure relative mt-3 flex min-h-11 w-full items-center justify-between gap-4 border-t border-[#c6d6c9] py-2 text-left text-xs font-semibold tracking-[0.03em] text-[#126d5b] transition-colors duration-300 hover:text-[#0b4d40] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:border-white/15 dark:text-[#a7eed9] dark:hover:text-white motion-reduce:transition-none"
        >
          <span aria-hidden="true" className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-[#168e78] transition-transform duration-300 group-hover/event-disclosure:scale-x-100 group-focus-visible/event-disclosure:scale-x-100 dark:bg-[#a7eed9] motion-reduce:transition-none" />
          <span>{expanded ? "Show less" : "Read more"}</span>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${expanded ? "rotate-180" : "motion-safe:group-hover/event-disclosure:translate-y-0.5"}`}>
            <path d="M10 4v11m-4-4 4 4 4-4" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function HolidayEventCard({ item, index }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState(null);
  const schedule = getHighlightSchedule(item);
  const imageUrl = item.image?.url;
  const dimensions = imageUrl && imageDimensions?.url === imageUrl ? imageDimensions : null;
  const isPortrait = dimensions && dimensions.height > dimensions.width;
  const portraitWidth = isPortrait ? `max(12rem, ${520 * dimensions.width / dimensions.height}px)` : null;
  const portraitPanelWidth = portraitWidth ? `calc(${portraitWidth} + 4rem)` : null;

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      style={{
        animationDelay: `${Math.min(index * 100, 300)}ms`,
        ...(portraitPanelWidth ? { "--event-media-width": portraitPanelWidth } : {}),
      }}
      className={`${visible ? "animate-highlight-card-enter" : ""} group relative grid min-w-0 overflow-hidden rounded-[1.75rem] border border-[#d5e6de] bg-[#fffdfa] shadow-[0_20px_55px_rgba(16,54,48,0.12)] dark:border-[#2d5a50] dark:bg-[#102b2b] ${isPortrait ? "lg:grid-cols-[minmax(0,min(40%,var(--event-media-width)))_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"}`}
    >
      <div
        className={`relative flex w-full flex-col justify-self-center overflow-hidden bg-[#123e38] p-5 sm:p-7 lg:p-8 ${isPortrait ? "rounded-2xl lg:rounded-none" : ""}`}
        style={portraitPanelWidth ? { maxWidth: portraitPanelWidth } : undefined}
      >
        <div aria-hidden="true" className="event-glow pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[#63dfb2]/20 blur-3xl" />
        <div aria-hidden="true" className="event-sparkle pointer-events-none absolute right-8 top-6 text-2xl text-[#f6d590]">✦</div>
        <div aria-hidden="true" className="event-upper-space pointer-events-none relative hidden min-h-0 flex-1 lg:block">
          <div className="event-space-decoration absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 300 120" className="h-[85%] max-h-36 w-full max-w-sm" fill="none">
              <ellipse cx="150" cy="60" rx="98" ry="33" stroke="#a7eed9" strokeOpacity=".2" />
              <ellipse cx="150" cy="60" rx="66" ry="23" stroke="#f6d590" strokeOpacity=".25" />
              <g className="event-space-orbit" style={{ transformOrigin: "150px 60px" }}>
                <circle cx="248" cy="60" r="3" fill="#f6d590" />
                <circle cx="52" cy="60" r="2" fill="#a7eed9" />
              </g>
              <g className="event-sparkle" style={{ transformOrigin: "150px 60px" }} fill="#f6d590">
                <path d="M150 37 155 55 173 60 155 65 150 83 145 65 127 60 145 55Z" />
              </g>
              <path d="m75 29 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Zm151 45 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#a7eed9" fillOpacity=".7" />
            </svg>
          </div>
        </div>
        <div
          className="relative w-full min-w-0 flex-none self-center"
          style={portraitWidth ? { maxWidth: portraitWidth } : undefined}
        >
          <div
            className="relative overflow-hidden rounded-2xl bg-[#0d302d] shadow-[0_15px_35px_rgba(0,0,0,0.2)] ring-1 ring-white/20"
            style={{ aspectRatio: dimensions ? `${dimensions.width} / ${dimensions.height}` : "4 / 3" }}
          >
            <PortfolioImage
              url={imageUrl}
              alt={`${item.title} poster`}
              fallbackText=""
              fallbackClassName="hidden"
              objectFit="contain"
              transparent
              onImageLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setImageDimensions({ url: imageUrl, width: naturalWidth, height: naturalHeight });
                }
              }}
              className="h-full w-full"
            />
          </div>
          <div className="relative mt-4 flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#a7eed9]/15 bg-[#f0fff8]/[0.06] px-4 py-3">
            <div aria-hidden="true" className="event-strip-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div aria-hidden="true" className="event-strip-icon relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#f6d590]/30 bg-[#f6d590]/10 text-[#f6d590]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z" />
                <path d="M19 3v3M17.5 4.5h3M5 17v3M3.5 18.5h3" />
              </svg>
            </div>
            <div className="relative min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a7eed9]/75">
                {item.kind === "holiday" ? "Holiday spotlight" : "Event spotlight"}
              </p>
              <p className="mt-1 text-sm font-medium leading-5 text-[#effff8]">A moment to share</p>
            </div>
            {schedule && (
              <div aria-hidden="true" className="relative shrink-0 border-l border-white/15 pl-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#f6d590]">{monthFormatter.format(new Date(schedule.startMs))}</p>
                <p className="text-xl font-semibold leading-6 tabular-nums text-white">{dayFormatter.format(new Date(schedule.startMs))}</p>
              </div>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="hidden min-h-0 flex-1 lg:block" />
      </div>

      <div className="relative flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:p-11">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-[#e7f6ed] dark:bg-[#244b40]/50" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e4f5ea] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#146b55] dark:bg-[#5be0bf]/15 dark:text-[#a7eed9]">
              {item.kind === "holiday" ? "Holiday" : "Event"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e7d4a9] bg-[#fff7e5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-[#815c20] dark:border-[#a98d53]/40 dark:bg-[#b99852]/10 dark:text-[#f3d9a0]">
              <span aria-hidden="true" className="event-status-dot h-1.5 w-1.5 rounded-full bg-[#bd8b35]" />
              Happening now
            </span>
          </div>
          <h3 className="mt-5 break-words text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#173c35] dark:text-white sm:text-3xl lg:text-4xl">
            {item.title}
          </h3>
          {item.description && (
            <ExpandableEventText
              text={item.description}
              label="event description"
              className="mt-4 text-sm leading-7 text-[#526c63] dark:text-white/75 sm:text-base"
            />
          )}
          {schedule && (
            <div className="mt-6 flex items-start gap-3 border-t border-[#e1ebe4] pt-5 dark:border-white/10">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f5ed] text-[#168e78] dark:bg-white/10 dark:text-[#83e6ce]">
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="4.5" width="14" height="12" rx="2" />
                  <path d="M6.5 3v3M13.5 3v3M3 8h14" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#789087] dark:text-white/50">When · Philippine time</p>
                <time dateTime={new Date(schedule.startMs).toISOString()} className="mt-1 block break-words text-sm font-medium leading-6 text-[#254a40] dark:text-white/85">
                  {formatManilaSchedule(schedule)}
                </time>
              </div>
            </div>
          )}
          {item.significance && (
            <div className="mt-5 rounded-xl border-l-[3px] border-[#e2bd73] bg-[#faf5e9] px-4 py-3 dark:bg-[#d2ac61]/10">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#92713a] dark:text-[#e8c987]">Why it matters</p>
              <ExpandableEventText
                text={item.significance}
                label="why it matters"
                className="mt-1 text-sm leading-6 text-[#5b604f] dark:text-white/80"
              />
            </div>
          )}
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#167c68] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#105e50] motion-reduce:transition-none dark:bg-[#a7eed9] dark:text-[#0f292d] dark:hover:bg-white">
              View event details
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
