import { Fragment } from "react";
import {
  isRichTextValue,
  markdownToHtml,
  parseRichTextDocument,
} from "../../lib/richText";

const allowedFontFamilies = new Set([
  "Aptos",
  "Aptos Display",
  "Arial",
  "Calibri",
  "Cambria",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Tahoma",
  "Times New Roman",
  "Verdana",
]);
const allowedAlignments = new Set(["left", "center", "right", "justify"]);

function safeColor(value) {
  if (typeof value !== "string") return "";
  if (/^#[\da-f]{3,8}$/i.test(value)) return value;
  if (
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(
      value,
    )
  ) {
    return value;
  }
  return "";
}

function safeLink(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? href
      : "";
  } catch {
    return "";
  }
}

function textStyle(attributes = {}) {
  const style = {};
  const color = safeColor(attributes.color);
  const backgroundColor = safeColor(attributes.backgroundColor);
  const fontFamily = String(attributes.fontFamily || "")
    .split(",")[0]
    .replace(/^['"]|['"]$/g, "")
    .trim();
  const fontSize = String(attributes.fontSize || "");
  const fontSizeMatch = fontSize.match(
    /^(\d+(?:\.\d+)?)(px|pt|em|rem|%)$/,
  );
  const maxFontSize = {
    em: 4,
    "%": 400,
    px: 64,
    pt: 48,
    rem: 4,
  };

  if (color) style.color = color;
  if (backgroundColor) style.backgroundColor = backgroundColor;
  if (
    fontSizeMatch &&
    Number(fontSizeMatch[1]) >= 0.5 &&
    Number(fontSizeMatch[1]) <= maxFontSize[fontSizeMatch[2]]
  ) {
    style.fontSize = fontSize;
  }
  if (allowedFontFamilies.has(fontFamily)) {
    style.fontFamily = fontFamily;
  }

  return Object.keys(style).length ? style : undefined;
}

function inlineContent(node, key) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") {
    return null;
  }
  if (node.type !== "text") return renderNode(node, key);

  let content = typeof node.text === "string" ? node.text : "";
  const marks = Array.isArray(node.marks) ? node.marks : [];
  for (const mark of marks) {
    if (!mark || typeof mark.type !== "string") continue;
    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "underline":
        content = <u>{content}</u>;
        break;
      case "strike":
        content = <s>{content}</s>;
        break;
      case "code":
        content = <code>{content}</code>;
        break;
      case "link": {
        const href = safeLink(mark.attrs?.href);
        if (href) {
          content = (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        }
        break;
      }
      case "textStyle": {
        const style = textStyle(mark.attrs);
        if (style) content = <span style={style}>{content}</span>;
        break;
      }
      default:
        break;
    }
  }

  return <Fragment key={key}>{content}</Fragment>;
}

function renderChildren(node, key) {
  return Array.isArray(node.content)
    ? node.content.map((child, index) =>
        inlineContent(child, `${key}-${index}`),
      )
    : null;
}

function alignmentStyle(node) {
  const alignment = node.attrs?.textAlign;
  return allowedAlignments.has(alignment)
    ? { textAlign: alignment }
    : undefined;
}

function renderNode(node, key) {
  if (!node || typeof node !== "object" || typeof node.type !== "string") {
    return null;
  }

  switch (node.type) {
    case "doc":
      return <Fragment key={key}>{renderChildren(node, key)}</Fragment>;
    case "listItem":
      return <li key={key}>{renderChildren(node, key)}</li>;
    case "paragraph":
      return (
        <p key={key} style={alignmentStyle(node)}>
          {renderChildren(node, key)}
        </p>
      );
    case "heading": {
      const level = [1, 2, 3].includes(node.attrs?.level)
        ? node.attrs.level
        : 2;
      const Heading = `h${level}`;
      return (
        <Heading key={key} style={alignmentStyle(node)}>
          {renderChildren(node, key)}
        </Heading>
      );
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node, key)}</ul>;
    case "orderedList": {
      const start = Number.isInteger(node.attrs?.start)
        ? node.attrs.start
        : undefined;
      return (
        <ol key={key} start={start}>
          {renderChildren(node, key)}
        </ol>
      );
    }
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{renderChildren(node, key)}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "hardBreak":
      return <br key={key} />;
    case "text":
      return inlineContent(node, key);
    default:
      return null;
  }
}

export default function RichTextContent({ content, className = "" }) {
  const value = typeof content === "string" ? content : "";
  const classes = `[&_a]:text-[#168e78] [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-[#5be0bf] [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#9bdcc8] [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-[#2d705f] [&_code]:rounded [&_code]:bg-[#f0f5f3] [&_code]:px-1 [&_code]:py-0.5 dark:[&_code]:bg-white/10 [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_li+li]:mt-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#f0f5f3] [&_pre]:p-3 dark:[&_pre]:bg-white/10 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ${className}`;

  if (isRichTextValue(value)) {
    const document = parseRichTextDocument(value);
    return (
      <div className={classes}>
        {document ? (
          renderNode(document, "rich-text")
        ) : (
          <p>Unable to display this description.</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={classes}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
    />
  );
}
