import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseLessonImport } from "./lessonImport.mjs";

test("recognizes the example's introduction and separated lessons", () => {
  const text = [
    "\uFEFF## Lessons that stay with me.",
    "An introduction to my journey.",
    "---",
    "**Pragmanila**",
    "",
    "## Humility Goes a Long Way",
    "Keep learning and stay humble.",
    "",
    "Appreciate those who share knowledge.",
    "---",
    "**Another company**",
    "## Different Workplaces",
    "Every culture is different.",
  ].join("\r\n");
  assert.deepEqual(parseLessonImport(text), {
    intro: { organization: "", title: "Lessons that stay with me.", description: "An introduction to my journey." },
    lessons: [
      { organization: "Pragmanila", title: "Humility Goes a Long Way", description: "Keep learning and stay humble.\n\nAppreciate those who share knowledge." },
      { organization: "Another company", title: "Different Workplaces", description: "Every culture is different." },
    ],
  });
});

test("imports ten plain text lessons separated by long lines of hyphens", () => {
  const separator = "-".repeat(72);
  const text = [
    "Beyond work\n\nA brief introduction.",
    ...Array.from({ length: 10 }, (_, index) =>
      `Company – Team ${index + 1} — Lesson ${index + 1}\n\nDescription ${index + 1}.`,
    ),
  ].join(`\n\n${separator}\n\n`);
  const { lessons, intro } = parseLessonImport(text);
  assert.equal(intro.title, "Beyond work");
  assert.equal(lessons.length, 10);
  assert.deepEqual(lessons[0], {
    organization: "Company – Team 1",
    title: "Lesson 1",
    description: "Description 1.",
  });
  assert.deepEqual(lessons[9], {
    organization: "Company – Team 10",
    title: "Lesson 10",
    description: "Description 10.",
  });
});

test("accepts an en dash between company and title", () => {
  assert.deepEqual(parseLessonImport("Company – Lesson\n\nDescription.").lessons, [
    { organization: "Company", title: "Lesson", description: "Description." },
  ]);
});

test("accepts headings without separators or organizations", () => {
  assert.deepEqual(parseLessonImport("## First lesson\nFirst description.\n\n## Second lesson\nSecond description."), {
    intro: null,
    lessons: [
      { organization: "", title: "First lesson", description: "First description." },
      { organization: "", title: "Second lesson", description: "Second description." },
    ],
  });
});

test("keeps bold companies with their headings without separators", () => {
  const text = "## Introduction\nWelcome.\n\n**Pragmanila**\n## First\nFirst description.\n\n**Accenture**\n## Second\nSecond description.";
  assert.deepEqual(parseLessonImport(text), {
    intro: { organization: "", title: "Introduction", description: "Welcome." },
    lessons: [
      { organization: "Pragmanila", title: "First", description: "First description." },
      { organization: "Accenture", title: "Second", description: "Second description." },
    ],
  });
});

test("accepts plain titles, labeled companies, and incomplete lessons for review", () => {
  assert.deepEqual(parseLessonImport("Company: Pragmanila\nTitle: Learning\nBe kind.\n---\nAnother lesson\n---\n" + "A".repeat(121)), {
    intro: null,
    lessons: [
      { organization: "Pragmanila", title: "Learning", description: "Be kind." },
      { organization: "", title: "Another lesson", description: "" },
      { organization: "", title: "", description: "A".repeat(121) },
    ],
  });
});

test("parses simple labeled lesson examples without keeping the description label", () => {
  assert.deepEqual(
    parseLessonImport(
      "Organization: Acme Inc.\nTitle: Keep learning\nDescription: Ask questions and share what you learn.",
    ),
    {
      intro: null,
      lessons: [
        {
          organization: "Acme Inc.",
          title: "Keep learning",
          description: "Ask questions and share what you learn.",
        },
      ],
    },
  );
});

test("does not discard a single heading as an introduction", () => {
  assert.deepEqual(parseLessonImport("## My lesson\nMy description."), {
    intro: null,
    lessons: [{ organization: "", title: "My lesson", description: "My description." }],
  });
});

test("preserves markdown and recognizes an unformatted company before a heading", () => {
  assert.deepEqual(parseLessonImport("Pragmanila\n## Working Together\nUse **kindness**.\n- Listen\n- Learn"), {
    intro: null,
    lessons: [{ organization: "Pragmanila", title: "Working Together", description: "Use **kindness**.\n- Listen\n- Learn" }],
  });
});

test("rejects empty or oversized lesson lists", () => {
  assert.throws(() => parseLessonImport(""), /Paste some text/);
  const text = Array(201).fill("## Lesson\nDescription").join("\n---\n");
  assert.throws(() => parseLessonImport(text), /up to 200 lessons/);
});
