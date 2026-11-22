import { MAX_LESSONS_PER_IMPORT, splitLessonImportBlocks } from "./lessonImport.mjs";

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
        else {
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
