"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function AccessibleDropdown({
  ariaLabel,
  ariaLabelledBy,
  className = "",
  onChange,
  options,
  triggerClassName = "",
  value,
}) {
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0,
  );
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = `${useId()}-listbox`;

  useEffect(() => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [selectedIndex]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const openAt = (index) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    openAt(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const handleOptionKeyDown = (event, index) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }

    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    else if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else return;

    event.preventDefault();
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const selectedOption = options[selectedIndex >= 0 ? selectedIndex : 0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-3 text-left text-sm font-medium text-[#122126] outline-none transition duration-200 dark:bg-[#0b1c22] dark:text-white ${
          open
            ? "border-[#22a98a] ring-2 ring-[#22a98a]/15 dark:border-[#5be0bf] dark:ring-[#5be0bf]/15"
            : "border-[#cbd9d5] hover:border-[#93cdbb] dark:border-white/15 dark:hover:border-[#4ed8b6]/60"
        } ${triggerClassName}`}
      >
        <span>{selectedOption.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 text-[#526e6b] transition-transform duration-200 dark:text-white/65 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="m5.5 7.5 4.5 4.5 4.5-4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="animate-custom-dropdown absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-y-auto rounded-xl border border-[#dce7e4] bg-white p-1.5 shadow-[0_16px_40px_rgba(16,54,48,0.16)] dark:border-white/15 dark:bg-[#102127] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;
            return (
              <button
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                  selected
                    ? "bg-[#eaf8f2] font-semibold text-[#11654f] dark:bg-[#123a31] dark:text-[#a7eed9]"
                    : active
                      ? "bg-[#f3f8f6] text-[#183037] dark:bg-white/5 dark:text-white"
                      : "text-[#526e6b] hover:bg-[#f3f8f6] hover:text-[#183037] dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <span>{option.label}</span>
                {selected && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4 shrink-0 text-[#168e78] dark:text-[#5be0bf]"
                  >
                    <path
                      d="m4.5 10 3.5 3.5 7.5-7.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
