"use client";

import { useState } from "react";
import { parseBulkContentImport } from "../../lib/bulkContentImport.mjs";
import { MAX_LESSON_IMPORT_BYTES } from "../../lib/lessonImport.mjs";

const fieldClass = "w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2.5 text-[#122126] outline-none focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/20 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white";

export default function BulkContentImport({ section, busy, onSave }) {
  const isProject = section === "projects";
  const label = isProject ? "projects" : "training and certificates";
  const [text, setText] = useState("");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

  const prepare = (value) => {
    setError("");
    setPreview([]);
    try {
      if (new TextEncoder().encode(value).length > MAX_LESSON_IMPORT_BYTES) {
        throw new Error("The text must be 512 KB or smaller.");
      }
      if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value)) {
        throw new Error("The text contains unsupported control characters.");
      }
      setPreview(parseBulkContentImport(section, value));
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
    if (files.length !== 1 || !/\.txt$/i.test(files[0].name)) {
      setError("Choose one .txt file.");
      return;
    }
    if (files[0].size > MAX_LESSON_IMPORT_BYTES) {
      setError("The text file must be 512 KB or smaller.");
      return;
    }
    setReading(true);
    try {
      const bytes = await files[0].arrayBuffer();
      let value;
      try {
        value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Error("Save the file as UTF-8 text and try again.");
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
    setPreview((current) => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    ));

  const save = async () => {
    setError("");
    if (preview.some((item) => !item.title.trim())) {
      setError("Add a title to every entry before saving.");
      return;
    }
    try {
      const saved = await onSave(preview);
      if (saved) {
        setText("");
        setPreview([]);
      }
    } catch (saveError) {
      console.error("Could not import drafts:", saveError);
      setError(saveError.message);
    }
  };

  const field = (item, index, name, title, multiline = false) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{title}</span>
      {multiline ? (
        <textarea rows={4} value={item[name] || ""} onChange={(event) => update(index, name, event.target.value)} className={fieldClass} />
      ) : (
        <input value={item[name] || ""} onChange={(event) => update(index, name, event.target.value)} className={fieldClass} />
      )}
    </label>
  );

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void readFile(Array.from(event.dataTransfer.files));
      }}
      className="rounded-2xl border border-dashed border-[#9bcdbd] bg-[#f2faf7] p-5 dark:border-[#2d705f] dark:bg-[#102a26]"
    >
      <p className="font-semibold">Import {label}</p>
      <p className="mt-1 text-sm leading-6 text-[#526e6b] dark:text-white/70">
        Drop a UTF-8 .txt file or paste text below. Separate entries with --- or
        headings. Review the fields before saving as drafts; nothing is published.
        Add images separately after import.
      </p>
      <details className="mt-3 text-sm text-[#526e6b] dark:text-white/70">
        <summary className="cursor-pointer font-semibold">Example text format</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-white p-3 dark:bg-[#0b1c22]">
          {isProject
            ? "Title: Portfolio website\nDescription: A personal website.\nTechnologies: React, Next.js\nLive URL: https://example.com\nSource URL: https://example.com/code\n---\nTitle: Another project\nDescription: Another project description."
            : "Title: Cloud training\nOrganization: Training provider\nDate: May 2025\nDescription: What I learned.\n---\nTitle: Another certificate\nOrganization: Issuer\nDate: 2025"}
        </pre>
      </details>
      <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-[#45b69a] bg-white px-4 py-2 font-medium text-[#126d5b] focus-within:outline focus-within:outline-2 focus-within:outline-[#168e78] dark:border-[#327d70] dark:bg-[#123a34] dark:text-[#83e6ce]">
        Choose .txt file
        <input type="file" accept=".txt,text/plain" disabled={busy || reading} className="sr-only" onChange={(event) => {
          const files = Array.from(event.currentTarget.files || []);
          event.currentTarget.value = "";
          if (files.length) void readFile(files);
        }} />
      </label>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium">Paste {label} text</span>
        <textarea rows={6} disabled={reading} value={text} onChange={(event) => {
          setText(event.target.value);
          setPreview([]);
          setError("");
        }} className={fieldClass} />
      </label>
      <p className="mt-1 text-xs text-[#526e6b] dark:text-white/60">
        Up to 512 KB and 200 entries. Only a title is required; URLs must include http:// or https://.
      </p>
      <button type="button" disabled={busy || reading} onClick={() => prepare(text)} className="mt-3 rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e]">
        Preview entries
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-[#b42318] dark:text-[#ffaaa8]">{error}</p>}
      {preview.length > 0 && (
        <div className="mt-5 space-y-4">
          <p className="font-semibold">Preview: {preview.length} {preview.length === 1 ? "entry" : "entries"}</p>
          {preview.map((item, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-[#cbded7] bg-white p-4 dark:border-white/15 dark:bg-[#102127]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Entry {index + 1}</p>
                <button type="button" onClick={() => setPreview((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-sm font-medium text-[#b42318] underline dark:text-[#ffaaa8]">Remove</button>
              </div>
              {field(item, index, "title", "Title")}
              {field(item, index, "description", "Description (optional)", true)}
              {isProject ? (
                <>
                  {field(item, index, "technologies", "Technologies (comma separated)")}
                  {field(item, index, "liveUrl", "Live project URL (optional)")}
                  {field(item, index, "sourceUrl", "Source code URL (optional)")}
                </>
              ) : (
                <>
                  {field(item, index, "organization", "Organization (optional)")}
                  {field(item, index, "date", "Date / year (e.g. May 2025, optional)")}
                </>
              )}
            </div>
          ))}
          <button type="button" disabled={busy || reading} onClick={() => void save()} className="rounded-lg bg-[#168e78] px-4 py-2 font-semibold text-white disabled:opacity-50 dark:bg-[#4ed8b6] dark:text-[#09201e]">Save as drafts</button>
        </div>
      )}
    </div>
  );
}
