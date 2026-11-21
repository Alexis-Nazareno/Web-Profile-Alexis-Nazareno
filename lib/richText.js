function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdownToHtml(value) {
  return escapeHtml(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/___(.+?)___/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_([^_\n]+)_([^\w]|$)/g, "$1<em>$2</em>$3");
}

export function markdownToHtml(markdown = "") {
  const lines = String(markdown).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let index = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      `<p>${paragraph.map(inlineMarkdownToHtml).join("<br />")}</p>`,
    );
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const listType = unorderedItem ? "ul" : orderedItem ? "ol" : "";

    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }

    if (listType) {
      flushParagraph();
      const listItems = [];
      while (index < lines.length) {
        const match =
          listType === "ul"
            ? lines[index].match(/^\s*[-*+]\s+(.+)$/)
            : lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
        if (!match) break;
        listItems.push(`<li>${inlineMarkdownToHtml(match[1])}</li>`);
        index += 1;
      }
      blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks.join("");
}

export const richTextPrefix = "portfolio-rich-text:v1:";

export function encodeRichTextDocument(document) {
  return `${richTextPrefix}${JSON.stringify(document)}`;
}

export function isRichTextValue(value) {
  return typeof value === "string" && value.startsWith(richTextPrefix);
}

export function parseRichTextDocument(value) {
  if (!isRichTextValue(value)) return null;

  try {
    const document = JSON.parse(value.slice(richTextPrefix.length));
    if (
      document?.type !== "doc" ||
      !Array.isArray(document.content) ||
      !document.content.every((node) => node && typeof node.type === "string")
    ) {
      return null;
    }
    return document;
  } catch {
    return null;
  }
}
