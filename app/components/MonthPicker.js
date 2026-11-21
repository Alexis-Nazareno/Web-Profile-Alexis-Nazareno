"use client";

import { useEffect, useRef, useState } from "react";
import { formatExperienceMonth } from "../../lib/experienceDates";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthPicker({
  label,
  value = "",
  required = false,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() =>
    value ? Number(value.slice(0, 4)) : new Date().getFullYear(),
  );
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedMonth = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/)?.[2];

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 block">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-[#b42318]">
            *
          </span>
        )}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${formatExperienceMonth(value) || "Select month and year"}`}
        onClick={() => {
          setViewYear(
            value ? Number(value.slice(0, 4)) : new Date().getFullYear(),
          );
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#cbd9d5] bg-white px-3 py-2.5 text-left text-[#122126] outline-none transition hover:border-[#22a98a] focus-visible:border-[#22a98a] focus-visible:ring-2 focus-visible:ring-[#22a98a]/20 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:hover:border-[#5be0bf] dark:focus-visible:border-[#5be0bf] dark:focus-visible:ring-[#5be0bf]/20"
      >
        <span className={value ? "" : "text-[#7b898a] dark:text-white/45"}>
          {formatExperienceMonth(value) || "Select month and year"}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 shrink-0 text-[#168e78] dark:text-[#5be0bf]"
        >
          <rect
            x="3.5"
            y="5"
            width="17"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M7.5 3.5v3M16.5 3.5v3M4 9.5h16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} calendar`}
          className="absolute left-0 top-full z-30 mt-2 w-[min(100%,20rem)] rounded-2xl border border-[#dce7e4] bg-white p-4 shadow-xl dark:border-white/15 dark:bg-[#102127]"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setViewYear((year) => year - 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dce7e4] text-lg text-[#385257] transition hover:border-[#22a98a] hover:bg-[#f2f8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168e78] dark:border-white/10 dark:text-white/80 dark:hover:border-[#5be0bf] dark:hover:bg-white/5 dark:focus-visible:outline-[#5be0bf]"
            >
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <h3 className="text-base font-semibold text-[#183037] dark:text-white">
              {viewYear}
            </h3>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setViewYear((year) => year + 1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dce7e4] text-lg text-[#385257] transition hover:border-[#22a98a] hover:bg-[#f2f8f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168e78] dark:border-white/10 dark:text-white/80 dark:hover:border-[#5be0bf] dark:hover:bg-white/5 dark:focus-visible:outline-[#5be0bf]"
            >
              <span aria-hidden="true">&rsaquo;</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const monthValue = `${viewYear}-${String(index + 1).padStart(2, "0")}`;
              const isSelected =
                selectedMonth === monthValue.slice(-2) &&
                value.slice(0, 4) === String(viewYear);

              return (
                <button
                  key={month}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#168e78] dark:focus-visible:outline-[#5be0bf] ${
                    isSelected
                      ? "bg-[#168e78] text-white dark:bg-[#4ed8b6] dark:text-[#09201e]"
                      : "text-[#385257] hover:bg-[#eaf7f2] hover:text-[#126d5b] dark:text-white/80 dark:hover:bg-[#153932] dark:hover:text-[#a7eed9]"
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {!required && value && (
            <div className="mt-4 border-t border-[#e4ece9] pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="text-sm font-medium text-[#b42318] transition hover:text-[#8f1d14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b42318] dark:text-[#ffaaa8] dark:hover:text-[#ffc7c4]"
              >
                Clear end date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
