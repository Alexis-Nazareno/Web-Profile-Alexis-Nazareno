export const MAX_LESSON_IMPORT_BYTES = 512 * 1024;
export const MAX_LESSONS_PER_IMPORT = 200;

function organizationLine(line) {
  const labeled = line.match(/^\s*(?:organization|company)\s*:\s*(.+?)\s*$/i);
  const bold = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
  return (labeled?.[1] || bold?.[1] || "").trim();
}

function parseBlock(block) {
  const lines = block.trim().split("\n");
  const first = lines.findIndex((line) => line.trim());
  const heading = lines.findIndex((line) => /^\s*#{1,3}\s+\S/.test(line));
  let organization = "";
  let title = "";
  let titleIndex = first;

  if (heading >= 0) {
    const before = lines.slice(first, heading).filter((line) => line.trim());
    if (before.length === 1) {
      organization = organizationLine(before[0]) || before[0].trim();
      titleIndex = heading;
      title = lines[heading].replace(/^\s*#{1,3}\s+/, "").trim();
    } else if (before.length === 0) {
      titleIndex = heading;
      title = lines[heading].replace(/^\s*#{1,3}\s+/, "").trim();
    }
  }

  if (!title) {
    const combined = lines[first].match(/^\s*(.+)\s+—\s+(.+?)\s*$/) ||
      lines[first].match(/^\s*(.+)\s+–\s+(.+?)\s*$/);
    const labeled = lines[first].match(/^\s*(?:organization|company)\s*:\s*(.+?)\s*$/i);
    if (combined) {
      organization = combined[1].trim();
      title = combined[2].trim();
    } else if (labeled) {
      organization = labeled[1].trim();
      titleIndex = lines.findIndex((line, index) => index > first && line.trim());
    }
    if (!title && titleIndex >= 0 && lines[titleIndex].trim().length <= 120) {
      title = lines[titleIndex].replace(/^\s*title\s*:\s*/i, "").trim();
    } else if (!title) {
      titleIndex -= 1;
    }
  }

  return {
    organization,
    title,
    description: lines.slice(titleIndex + 1).join("\n").trim(),
  };
}

export function splitLessonImportBlocks(text) {
  const chunks = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split(/^[ \t]*-{3,}[ \t]*$/m)
    .map((block) => block.trim())
    .filter(Boolean);
  const blocks = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const headings = lines.flatMap((line, index) =>
      /^\s*#{1,3}\s+\S/.test(line) ? [index] : [],
    );
    if (headings.length < 2) {
      blocks.push(chunk);
      continue;
    }
    let start = 0;
    for (const heading of headings.slice(1)) {
      let end = heading;
      let previous = heading - 1;
      while (previous >= start && !lines[previous].trim()) previous -= 1;
      if (previous >= start && organizationLine(lines[previous])) end = previous;
      blocks.push(lines.slice(start, end).join("\n").trim());
      start = end;
    }
    blocks.push(lines.slice(start).join("\n").trim());
  }

  if (!blocks.length) throw new Error("Paste some text or choose a text file first.");
  return blocks.filter(Boolean);
}

export function parseLessonImport(text) {
  const blocks = splitLessonImportBlocks(text);
  if (blocks.length > MAX_LESSONS_PER_IMPORT + 1) {
    throw new Error(`Import up to ${MAX_LESSONS_PER_IMPORT} lessons at a time.`);
  }

  const parsed = blocks.map(parseBlock);
  const intro = parsed.length > 1 && !parsed[0].organization &&
    (/^\s*#{1,3}\s+\S/.test(blocks[0]) ||
      /^(?:beyond work|intro(?:duction)?|lessons that stay with me\.?)$/i.test(parsed[0].title)) &&
    parsed.slice(1).some((lesson) => lesson.organization)
    ? parsed.shift()
    : null;

  if (parsed.length > MAX_LESSONS_PER_IMPORT) {
    throw new Error(`Import up to ${MAX_LESSONS_PER_IMPORT} lessons at a time.`);
  }
  return { lessons: parsed, intro };
}
