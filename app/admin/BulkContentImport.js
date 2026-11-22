"use client";

import { useState } from "react";
import { parseBulkContentImport } from "../../lib/bulkContentImport.mjs";
import {
  MAX_LESSON_IMPORT_BYTES,
  MAX_LESSONS_PER_IMPORT,
  parseLessonImport,
} from "../../lib/lessonImport.mjs";

const fieldClass =
  "w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2.5 text-[#122126] outline-none transition focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/20 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white";

const importOptions = {
  experience: {
    label: "professional experience",
    itemLabel: "experience",
    itemPluralLabel: "experiences",
    example:
      "Role: [your job title]\nCompany: [company name]\nStart date: 2024\nEnd date: Present\nDescription: [what you did]\n---\nRole: [another job title]\nCompany: [company name]\nStart date: 2020\nEnd date: 2022",
  },
  projects: {
    label: "projects",
    itemLabel: "project",
    itemPluralLabel: "projects",
    example:
      "Title: [project name]\nDescription: [what the project does]\nTechnologies: React, Next.js\nLive URL: https://example.com\nSource URL: https://example.com/code\n---\nTitle: [another project]\nDescription: [what the project does]",
  },
  achievements: {
    label: "training and certificates",
    itemLabel: "training or certificate",
    itemPluralLabel: "training or certificates",
    example:
      "Title: [training or certificate name]\nOrganization: [who issued it]\nDate: May 2025\nDescription: [what you learned]\n---\nTitle: [another certificate]\nOrganization: [who issued it]\nDate: 2024",
  },
  lessons: {
    label: "work lessons",
    itemLabel: "lesson",
    itemPluralLabel: "lessons",
    example:
      "Organization: [company name]\nTitle: [lesson title]\nDescription: [what you learned]\n---\nOrganization: [another company]\nTitle: [another lesson]\nDescription: [what you learned]",
  },
};

function normalizedExperienceDate(value, isEndDate = false) {
  if (/^\d{4}$/.test(value)) {
    return `${value}-${isEndDate ? "12" : "01"}`;
  }
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : "";
}

export default function BulkContentImport({ section, busy, onSave }) {
  const options = importOptions[section];
  const isExperience = section === "experience";
  const isLesson = section === "lessons";
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [intro, setIntro] = useState(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  const prepare = (value) => {
    setError("");
    setPreview([]);
    setIntro(null);
    try {
      if (!value.trim()) {
        throw new Error("Choose a .txt file or paste your text first.");
      }
      if (new TextEncoder().encode(value).length > MAX_LESSON_IMPORT_BYTES) {
        throw new Error("The text must be 512 KB or smaller.");
      }
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
        throw new Error("The text contains unsupported characters. Check it and try again.");
      }
      if (isLesson) {
        const result = parseLessonImport(value);
        setPreview(result.lessons);
        setIntro(result.intro);
      } else {
        setPreview(parseBulkContentImport(section, value));
      }
    } catch (previewError) {
      setError(previewError.message);
    }
  };

  const readFile = async (files) => {
    if (busy || reading) {
      setError("Wait for the current action to finish before importing.");
      return;
    }
    setError("");
    setPreview([]);
    setIntro(null);
    if (files.length !== 1 || !/\.txt$/i.test(files[0].name)) {
      setError("Choose one .txt file.");
      return;
    }
    if (files[0].size > MAX_LESSON_IMPORT_BYTES) {
      setError("The .txt file must be 512 KB or smaller.");
      return;
    }
    setReading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      let value;
      try {
        value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Error("This file can't be read. Save it as a plain-text .txt file and try again.");
      }
      setText(value);
      prepare(value);
    } catch (readError) {
      console.error("Could not read the import file:", readError);
      setError(readError.message);
    } finally {
      setReading(false);
    }
  };

  const update = (index, field, value) =>
    setPreview((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );

  const save = async () => {
    setError("");
    const invalidEntry = preview.findIndex((item) => {
      if (!item.title.trim()) return true;
      if (!isExperience) return false;
      const startDate = normalizedExperienceDate(item.startDate);
      if (!startDate) return true;
      if (item.isCurrent) return Boolean(item.endDate);
      const endDate = normalizedExperienceDate(item.endDate, true);
      return !endDate || endDate < startDate;
    });
    if (invalidEntry >= 0) {
      setError(
        isExperience
          ? `Check entry ${invalidEntry + 1}: add a job title and start date (YYYY or YYYY-MM). Select “I currently work here” or enter an end date that is not before the start date.`
          : `Add a title to entry ${invalidEntry + 1} before saving.`,
      );
      return;
    }
    try {
      const saved = await onSave(section, preview);
      if (saved) {
        setText("");
        setPreview([]);
        setIntro(null);
      }
    } catch (saveError) {
      console.error("Could not import drafts:", saveError);
      setError(saveError.message);
    }
  };

  const field = (item, index, name, label, options = {}) => (
    <label className={`block ${options.className || ""}`}>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {options.multiline ? (
        <textarea
          rows={4}
          value={item[name] || ""}
          onChange={(event) => update(index, name, event.target.value)}
          className={fieldClass}
        />
      ) : (
        <input
          type={options.type || "text"}
          value={item[name] || ""}
          onChange={(event) => update(index, name, event.target.value)}
          className={fieldClass}
        />
      )}
    </label>
  );

  if (!options) return null;

  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void readFile(Array.from(event.dataTransfer.files));
      }}
      className="rounded-2xl border border-dashed border-[#9bcdbd] bg-[#f2faf7] p-5 dark:border-[#2d705f] dark:bg-[#102a26]"
    >
      <h3 className="font-semibold text-[#183037] dark:text-white">
        Import {options.label}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
        Choose a .txt file or paste your text below. For multiple entries, put
        --- on a line by itself between them. Check the preview before saving.
        Imports are saved as drafts and are not published.
        {!isLesson && " Add images or logos after importing."}
      </p>
      <details className="mt-3 text-sm text-[#526e6b] dark:text-white/70">
        <summary className="cursor-pointer font-semibold">
          See an example
        </summary>
        <p className="mt-2">
          Keep labels like Title: and Description:, and replace the text in
          [brackets].
        </p>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 dark:bg-[#0b1c22]">
          {options.example}
        </pre>
      </details>
      <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-[#45b69a] bg-white px-4 py-2 font-medium text-[#126d5b] transition hover:bg-[#e8f7f2] focus-within:outline focus-within:outline-2 focus-within:outline-[#168e78] dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce] dark:hover:bg-[#18483f]">
        Choose .txt file
        <input
          type="file"
          accept=".txt,text/plain"
          disabled={busy || reading}
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            event.currentTarget.value = "";
            if (files.length) void readFile(files);
          }}
        />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium">
          Paste your text
        </span>
        <textarea
          rows={6}
          disabled={reading}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPreview([]);
            setIntro(null);
            setError("");
          }}
          placeholder="Paste your text here..."
          className={fieldClass}
        />
      </label>
      <p className="mt-1 text-xs text-[#526e6b] dark:text-white/60">
        Up to 512 KB and {MAX_LESSONS_PER_IMPORT} entries per import. Each entry
        needs a title.
        {isExperience &&
          " Use YYYY for a year (2024) or YYYY-MM for a month (2024-05). Select “I currently work here” to show Present."}
        {!isExperience &&
          !isLesson &&
          " Links must start with https:// or http://."}
      </p>
      <button
        type="button"
        disabled={busy || reading}
        onClick={() => prepare(text)}
        className="mt-3 rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e]"
      >
        Preview entries
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#b42318] dark:text-[#ffaaa8]">
          {error}
        </p>
      )}
      {intro && (
        <div className="mt-4 rounded-lg border border-[#b8ccc5] p-3 text-sm dark:border-white/15">
          <p>
            This looks like an introduction and was skipped: <strong>{intro.title}</strong>
          </p>
          <p className="mt-1 whitespace-pre-wrap">{intro.description}</p>
          <button
            type="button"
            disabled={preview.length >= MAX_LESSONS_PER_IMPORT}
            onClick={() => {
              setPreview((current) => [intro, ...current]);
              setIntro(null);
            }}
            className="mt-2 font-semibold text-[#126d5b] underline disabled:opacity-50 dark:text-[#83e6ce]"
          >
            Include as a lesson
          </button>
          {preview.length >= MAX_LESSONS_PER_IMPORT && (
            <p className="mt-1">
              Remove a lesson to include this introduction.
            </p>
          )}
        </div>
      )}
      {preview.length > 0 && (
        <div className="mt-5 space-y-4">
          <p className="font-semibold">
            Preview: {preview.length}{" "}
            {preview.length === 1
              ? options.itemLabel
              : options.itemPluralLabel}
          </p>
          {preview.map((item, index) => (
            <article
              key={index}
              className="space-y-3 rounded-xl border border-[#cbded7] bg-white p-4 dark:border-white/15 dark:bg-[#102127]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {options.itemLabel} {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setPreview((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="text-sm font-medium text-[#b42318] underline dark:text-[#ffaaa8]"
                >
                  Remove
                </button>
              </div>
              {field(item, index, "title", isExperience ? "Role" : "Title")}
              {isExperience ? (
                <>
                  {field(item, index, "organization", "Company")}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field(item, index, "startDate", "Start date (YYYY or YYYY-MM)")}
                    {item.isCurrent ? (
                      <div>
                        <span className="mb-1 block text-sm font-medium">
                          End date
                        </span>
                        <p className="rounded-lg border border-[#cbd9d5] bg-[#f2faf7] px-3 py-2.5 text-[#126d5b] dark:border-white/15 dark:bg-[#0b1c22] dark:text-[#83e6ce]">
                          Present
                        </p>
                      </div>
                    ) : (
                      field(item, index, "endDate", "End date (YYYY or YYYY-MM)")
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#526e6b] dark:text-white/70">
                    <input
                      type="checkbox"
                      checked={Boolean(item.isCurrent)}
                      onChange={(event) => {
                        update(index, "isCurrent", event.target.checked);
                        if (event.target.checked) update(index, "endDate", "");
                      }}
                      className="h-4 w-4 accent-[#168e78]"
                    />
                    I currently work here
                  </label>
                </>
              ) : isLesson ? (
                field(item, index, "organization", "Organization (optional)")
              ) : section === "projects" ? (
                <>
                  {field(item, index, "technologies", "Tools used (separate with commas)")}
                  {field(item, index, "liveUrl", "Project link (optional)")}
                  {field(item, index, "sourceUrl", "Source code link (optional)")}
                </>
              ) : (
                <>
                  {field(item, index, "organization", "Organization (optional)")}
                  {field(item, index, "date", "Date or year (optional)")}
                </>
              )}
              {field(item, index, "description", "Description (optional)", {
                multiline: true,
              })}
            </article>
          ))}
          <button
            type="button"
            disabled={busy || reading}
            onClick={() => void save()}
            className="rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e]"
          >
            Save drafts
          </button>
        </div>
      )}
    </section>
  );
}
