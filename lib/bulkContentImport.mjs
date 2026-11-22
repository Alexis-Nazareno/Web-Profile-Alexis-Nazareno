import { MAX_LESSONS_PER_IMPORT, splitLessonImportBlocks } from "./lessonImport.mjs";
import { getHighlightSchedule } from "./highlightSchedule.mjs";

const fieldsBySection = {
  projects: {
    title: "title",
    description: "description",
    technologies: "technologies",
    "tech stack": "technologies",
    "live url": "liveUrl",
    "live project url": "liveUrl",
    "source url": "sourceUrl",
    "source code url": "sourceUrl",
  },
  achievements: {
    title: "title",
    description: "description",
    organization: "organization",
    provider: "organization",
    issuer: "organization",
    date: "date",
    year: "date",
  },
  experience: {
    title: "title",
    role: "title",
    description: "description",
    organization: "organization",
    company: "organization",
    "start date": "startDate",
    "end date": "endDate",
  },
  highlights: {
    type: "kind",
    category: "kind",
    title: "title",
    description: "description",
    "show from": "startsAt",
    "show until": "endsAt",
    "why it matters": "significance",
    significance: "significance",
    link: "link",
    url: "link",
  },
};

export function parseBulkContentImport(section, text) {
  const fields = fieldsBySection[section];
  if (!fields) throw new Error("This section does not support bulk imports.");
  const blocks = splitLessonImportBlocks(text);
  if (blocks.length > MAX_LESSONS_PER_IMPORT) {
    throw new Error(`Import up to ${MAX_LESSONS_PER_IMPORT} entries at a time.`);
  }

  return blocks.map((block, index) => {
    const item = { title: "", description: "" };
    if (section === "experience") {
      item.organization = "";
      item.startDate = "";
      item.endDate = "";
      item.isCurrent = true;
      item.datePrecision = "month";
    }
    if (section === "highlights") {
      item.kind = "event";
      item.startsAt = "";
      item.endsAt = "";
      item.link = "";
      item.significance = "";
    }
    const description = [];
    const seen = new Set();
    let firstUnlabeledSeen = false;
    const lines = block.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([a-z ]+)\s*:\s*(.*)$/i);
      const field = match && fields[match[1].trim().toLowerCase()];
      if (field) {
        if (seen.has(field)) {
          throw new Error(`Entry ${index + 1} has more than one ${match[1].trim()} field. Check the text before importing.`);
        }
        seen.add(field);
        if (field === "description") description.push(match[2]);
        else if (section === "highlights" && field === "kind") {
          const value = match[2].trim().toLowerCase();
          if (!["holiday", "event"].includes(value)) {
            throw new Error(
              `Entry ${index + 1}: Type must be Holiday or Event.`,
            );
          }
          item.kind = value;
        } else if (
          section === "highlights" &&
          ["startsAt", "endsAt"].includes(field)
        ) {
          item[field] = match[2]
            .trim()
            .replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/, "$1T$2");
        } else {
          const value = match[2].trim();
          if (field === "endDate") {
            item.isCurrent =
              !value || /^(present|current|now)$/i.test(value);
            item.endDate = item.isCurrent ? "" : value;
          } else {
            item[field] = value;
          }
        }
      } else if (!seen.has("title") && !firstUnlabeledSeen && line.trim()) {
        firstUnlabeledSeen = true;
        const title = line.replace(/^\s*#{1,3}\s+/, "").trim();
        if (title.length <= 120) {
          item.title = title.replace(/^\*\*(.+)\*\*$/, "$1");
          seen.add("title");
        } else {
          description.push(line);
        }
      } else {
        description.push(line);
      }
    }
    item.description = description.join("\n").trim();
    if (section === "experience") {
      item.datePrecision =
        /^\d{4}$/.test(item.startDate) &&
        (!item.endDate || /^\d{4}$/.test(item.endDate))
          ? "year"
          : "month";
    }
    return item;
  });
}
