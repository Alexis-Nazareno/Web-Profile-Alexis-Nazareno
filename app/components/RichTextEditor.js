"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  BackgroundColor,
  Color,
  FontFamily,
  FontSize,
  TextStyle,
} from "@tiptap/extension-text-style";
import {
  encodeRichTextDocument,
  isRichTextValue,
  markdownToHtml,
  parseRichTextDocument,
} from "../../lib/richText";

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      autolink: false,
      defaultProtocol: "https",
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    },
  }),
  TextStyle,
  Color,
  BackgroundColor,
  FontFamily,
  FontSize,
  TextAlign.configure({
    types: ["heading", "paragraph"],
    alignments: ["left", "center", "right", "justify"],
  }),
];

const fontSizes = [
  ["8pt", "8"],
  ["9pt", "9"],
  ["10pt", "10"],
  ["11pt", "11"],
  ["12pt", "12"],
  ["14pt", "14"],
  ["16pt", "16"],
  ["18pt", "18"],
  ["20pt", "20"],
  ["22pt", "22"],
  ["24pt", "24"],
  ["26pt", "26"],
  ["28pt", "28"],
  ["36pt", "36"],
  ["48pt", "48"],
];

const fontFamilies = [
  ["", "Default font"],
  ["Arial", "Arial"],
  ["Georgia", "Georgia"],
  ["Tahoma", "Tahoma"],
  ["Times New Roman", "Times New Roman"],
  ["Verdana", "Verdana"],
];

function normalizeLink(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  const href = /^(https?:\/\/|mailto:|tel:)/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol)
      ? href
      : "";
  } catch {
    return "";
  }
}

function colorForInput(value, fallback) {
  if (typeof value !== "string") return fallback;
  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    if (hex[1].length === 6) return value;
    return `#${hex[1]
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  const rgb = value.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i,
  );
  if (!rgb) return fallback;
  const channels = rgb.slice(1, 4).map((channel) => Number(channel));
  if (channels.some((channel) => channel > 255)) return fallback;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function RibbonGroup({ label, children }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5"
    >
      {children}
    </div>
  );
}

function RibbonButton({
  label,
  children,
  active = false,
  disabled = false,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168e78] disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:outline-[#5be0bf] ${
        active
          ? "border-[#9bdcc8] bg-[#eaf8f2] text-[#11654f] dark:border-[#2d705f] dark:bg-[#123a31] dark:text-[#a7eed9]"
          : "border-transparent text-[#385257] hover:border-[#dce7e4] hover:bg-white dark:text-white/80 dark:hover:border-white/15 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function ColorControl({ label, value, onChange, children }) {
  return (
    <label
      title={label}
      className="flex h-9 cursor-pointer items-center gap-1 rounded-lg border border-transparent px-2 text-sm text-[#385257] transition hover:border-[#dce7e4] hover:bg-white dark:text-white/80 dark:hover:border-white/15 dark:hover:bg-white/10"
    >
      <span>{children}</span>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
      />
    </label>
  );
}

export default function RichTextEditor({ label, value = "", onChange }) {
  const lastValueRef = useRef(value);
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [linkNotice, setLinkNotice] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkHref, setLinkHref] = useState("");
  const [linkHasSelection, setLinkHasSelection] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: editorExtensions,
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": label,
        class:
          "min-h-48 max-h-[28rem] overflow-y-auto px-4 py-3 text-sm leading-7 text-[#122126] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#168e78] dark:text-white dark:focus-visible:outline-[#5be0bf] [&_p]:my-2 [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li+li]:mt-1 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-[#9bdcc8] [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:border-[#2d705f] [&_hr]:my-4",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const nextValue = currentEditor.isEmpty
        ? ""
        : encodeRichTextDocument(currentEditor.getJSON());
      lastValueRef.current = nextValue;
      onChangeRef.current(nextValue);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!initializedRef.current || value !== lastValueRef.current) {
      const document = isRichTextValue(value)
        ? parseRichTextDocument(value)
        : markdownToHtml(value);
      editor.commands.setContent(document || "", { emitUpdate: false });
      lastValueRef.current = value;
      initializedRef.current = true;
    }
  }, [editor, value]);

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) return null;
      const blockName = currentEditor.isActive("heading")
        ? "heading"
        : "paragraph";
      const textStyle = currentEditor.getAttributes("textStyle");

      return {
        bold: currentEditor.isActive("bold"),
        italic: currentEditor.isActive("italic"),
        underline: currentEditor.isActive("underline"),
        strike: currentEditor.isActive("strike"),
        bulletList: currentEditor.isActive("bulletList"),
        orderedList: currentEditor.isActive("orderedList"),
        blockquote: currentEditor.isActive("blockquote"),
        link: currentEditor.isActive("link"),
        blockStyle: currentEditor.isActive("heading")
          ? `heading-${currentEditor.getAttributes("heading").level}`
          : currentEditor.isActive("blockquote")
            ? "blockquote"
            : "paragraph",
        alignment:
          currentEditor.getAttributes(blockName).textAlign || "left",
        fontSize: textStyle.fontSize || "12pt",
        fontFamily: textStyle.fontFamily || "",
        color: textStyle.color || "#183037",
        backgroundColor: textStyle.backgroundColor || "#fff2a8",
        canUndo: currentEditor.can().undo(),
        canRedo: currentEditor.can().redo(),
      };
    },
  });
  const state = toolbarState || {};

  const applyBlockStyle = (blockStyle) => {
    if (blockStyle === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else if (blockStyle === "blockquote") {
      editor.chain().focus().setBlockquote().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: Number(blockStyle.slice(-1)) })
        .run();
    }
  };

  const openLinkPanel = () => {
    setLinkNotice("");
    const selection = editor.state.selection;
    const selectedText = editor.state.doc
      .textBetween(selection.from, selection.to, " ")
      .trim();
    setLinkText(selectedText);
    setLinkHasSelection(Boolean(selectedText));
    setLinkHref(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = normalizeLink(linkHref);
    if (!href) {
      setLinkNotice("Enter a valid web address, email, or phone link.");
      return;
    }

    if (linkHasSelection) {
      editor.chain().focus().setLink({ href }).run();
    } else if (linkText.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: linkText.trim(),
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      setLinkNotice("Enter the text you want to display for this link.");
      return;
    }
    setLinkNotice("");
    setLinkOpen(false);
  };

  if (!editor) {
    return (
      <div>
        <span className="mb-1 block">{label}</span>
        <div className="min-h-48 animate-pulse rounded-xl border border-[#dce7e4] bg-[#f7fbfa] dark:border-white/10 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <span className="block font-medium">{label}</span>
        <span className="text-xs text-[#778785] dark:text-white/45">
          Word-style formatting
        </span>
      </div>
      <div className="relative rounded-2xl border border-[#cbd9d5] bg-white dark:border-white/15 dark:bg-[#0b1c22]">
        <div
          role="toolbar"
          aria-label={`${label} formatting toolbar`}
          className="flex flex-wrap items-center gap-1.5 border-b border-[#dce7e4] bg-[#f7fbfa] px-2 py-2 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <RibbonGroup label="History">
            <RibbonButton
              label="Undo"
              disabled={!state.canUndo}
              onClick={() => editor.chain().focus().undo().run()}
            >
              ↶
            </RibbonButton>
            <RibbonButton
              label="Redo"
              disabled={!state.canRedo}
              onClick={() => editor.chain().focus().redo().run()}
            >
              ↷
            </RibbonButton>
          </RibbonGroup>

          <span aria-hidden="true" className="h-6 w-px bg-[#dce7e4] dark:bg-white/10" />

          <RibbonGroup label="Paragraph style">
            <select
              aria-label="Paragraph style"
              value={state.blockStyle || "paragraph"}
              onChange={(event) => applyBlockStyle(event.target.value)}
              className="h-8 max-w-32 rounded-md border border-[#cbd9d5] bg-white px-2 text-xs text-[#20363a] outline-none focus:border-[#22a98a] dark:border-white/15 dark:bg-[#102127] dark:text-white"
            >
              <option value="paragraph">Paragraph</option>
              <option value="heading-1">Heading 1</option>
              <option value="heading-2">Heading 2</option>
              <option value="heading-3">Heading 3</option>
              <option value="blockquote">Quote</option>
            </select>
          </RibbonGroup>

          <span aria-hidden="true" className="h-6 w-px bg-[#dce7e4] dark:bg-white/10" />

          <RibbonGroup label="Basic formatting">
            <RibbonButton
              label="Bold"
              active={state.bold}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </RibbonButton>
            <RibbonButton
              label="Italic"
              active={state.italic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </RibbonButton>
            <RibbonButton
              label="Underline"
              active={state.underline}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <span className="underline">U</span>
            </RibbonButton>
          </RibbonGroup>

          <span aria-hidden="true" className="h-6 w-px bg-[#dce7e4] dark:bg-white/10" />

          <RibbonGroup label="Lists">
            <RibbonButton
              label="Bulleted list"
              active={state.bulletList}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              •
            </RibbonButton>
            <RibbonButton
              label="Numbered list"
              active={state.orderedList}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1.
            </RibbonButton>
          </RibbonGroup>

          <RibbonGroup label="Link">
            <RibbonButton
              label="Add link"
              active={state.link}
              onClick={openLinkPanel}
            >
              ↗
            </RibbonButton>
          </RibbonGroup>

          <details className="relative ml-auto">
            <summary
              title="More formatting options"
              className="flex h-8 cursor-pointer select-none list-none items-center gap-1 rounded-md border border-[#cbd9d5] px-2 text-xs font-medium text-[#385257] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168e78] dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10 dark:focus-visible:outline-[#5be0bf]"
            >
              More <span aria-hidden="true">⌄</span>
            </summary>
            <div
              role="group"
              aria-label="More formatting options"
              className="absolute right-0 top-full z-30 mt-2 flex w-80 max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-xl border border-[#cbd9d5] bg-white p-2 shadow-xl dark:border-white/15 dark:bg-[#102127]"
            >
              <select
                aria-label="Font family"
                value={state.fontFamily || ""}
                onChange={(event) =>
                  event.target.value
                    ? editor.chain().focus().setFontFamily(event.target.value).run()
                    : editor.chain().focus().unsetFontFamily().run()
                }
                className="h-8 max-w-36 rounded-md border border-[#cbd9d5] bg-white px-2 text-xs text-[#20363a] outline-none focus:border-[#22a98a] dark:border-white/15 dark:bg-[#0b1c22] dark:text-white"
              >
                {fontFamilies.map(([value, name]) => (
                  <option key={value || "default"} value={value}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Font size"
                value={state.fontSize || "12pt"}
                onChange={(event) =>
                  editor.chain().focus().setFontSize(event.target.value).run()
                }
                className="h-8 w-16 rounded-md border border-[#cbd9d5] bg-white px-2 text-xs text-[#20363a] outline-none focus:border-[#22a98a] dark:border-white/15 dark:bg-[#0b1c22] dark:text-white"
              >
                {fontSizes.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
              <RibbonButton
                label="Strikethrough"
                active={state.strike}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <span className="line-through">S</span>
              </RibbonButton>
              <ColorControl
                label="Text color"
                value={colorForInput(state.color, "#183037")}
                onChange={(color) => editor.chain().focus().setColor(color).run()}
              >
                <span className="border-b-2 border-current font-bold">A</span>
              </ColorControl>
              <ColorControl
                label="Text highlight"
                value={colorForInput(state.backgroundColor, "#fff2a8")}
                onChange={(color) =>
                  editor.chain().focus().setBackgroundColor(color).run()
                }
              >
                ▰
              </ColorControl>
              <span aria-hidden="true" className="h-6 w-px bg-[#dce7e4] dark:bg-white/10" />
              {["left", "center", "right", "justify"].map((alignment) => (
                <RibbonButton
                  key={alignment}
                  label={`Align ${alignment}`}
                  active={state.alignment === alignment}
                  onClick={() =>
                    editor.chain().focus().setTextAlign(alignment).run()
                  }
                >
                  {alignment === "justify"
                    ? "J"
                    : alignment.slice(0, 1).toUpperCase()}
                </RibbonButton>
              ))}
              <RibbonButton
                label="Block quote"
                active={state.blockquote}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                “ ”
              </RibbonButton>
              {state.link && (
                <RibbonButton
                  label="Remove link"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                >
                  Unlink
                </RibbonButton>
              )}
              <RibbonButton
                label="Horizontal line"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                ―
              </RibbonButton>
              <RibbonButton
                label="Clear formatting"
                disabled={editor.isEmpty}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .unsetAllMarks()
                    .clearNodes()
                    .unsetTextAlign()
                    .run()
                }
              >
                Tx
              </RibbonButton>
            </div>
          </details>
        </div>

        {linkOpen && (
          <div
            role="group"
            aria-label="Link settings"
            className="flex flex-wrap items-end gap-3 border-b border-[#dce7e4] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#102127]"
          >
            <label className="min-w-40 flex-1 text-xs font-medium text-[#52676a] dark:text-white/65">
              Link text
              <input
                type="text"
                value={linkText}
                readOnly={linkHasSelection}
                onChange={(event) => setLinkText(event.target.value)}
                placeholder="Text to display"
                className="mt-1 block w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2 text-sm text-[#122126] outline-none focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/15 read-only:bg-[#f2f7f5] dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:focus:border-[#5be0bf] dark:read-only:bg-white/5"
              />
            </label>
            <label className="min-w-48 flex-[2] text-xs font-medium text-[#52676a] dark:text-white/65">
              Web address
              <input
                type="url"
                value={linkHref}
                onChange={(event) => setLinkHref(event.target.value)}
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-lg border border-[#cbd9d5] bg-white px-3 py-2 text-sm text-[#122126] outline-none focus:border-[#22a98a] focus:ring-2 focus:ring-[#22a98a]/15 dark:border-white/15 dark:bg-[#0b1c22] dark:text-white dark:focus:border-[#5be0bf]"
              />
            </label>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={applyLink}
              className="rounded-lg bg-[#168e78] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] dark:bg-[#4ed8b6] dark:text-[#09201e] dark:hover:bg-[#7ce9ce]"
            >
              Apply link
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setLinkOpen(false);
                setLinkNotice("");
                editor.chain().focus().run();
              }}
              className="rounded-lg border border-[#cbd9d5] px-4 py-2 text-sm font-medium text-[#385257] transition hover:bg-[#f2f7f5] dark:border-white/15 dark:text-white/75 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      {linkNotice ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {linkNotice}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-5 text-[#667779] dark:text-white/55">
          Paste from Word or Google Docs, or use the toolbar. Paragraphs, lists,
          headings, links, fonts, colors, and alignment are supported.
        </p>
      )}
    </div>
  );
}
