import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseBulkContentImport } from "./bulkContentImport.mjs";

test("parses multiple projects and retains their links and technologies", () => {
  const text = "Title: First project\nDescription: First paragraph.\n\nSecond paragraph.\nTechnologies: React, Node.js\nLive URL: https://example.com\nSource URL: https://example.com/code\n--------\n## Second project\nAnother description.";
  assert.deepEqual(parseBulkContentImport("projects", text), [
    { title: "First project", description: "First paragraph.\n\nSecond paragraph.", technologies: "React, Node.js", liveUrl: "https://example.com", sourceUrl: "https://example.com/code" },
    { title: "Second project", description: "Another description." },
  ]);
});

test("parses training and certificates into the same section", () => {
  const text = "Title: First training\nProvider: Learning Co\nDate: May 2025\nDescription: Learned new skills.\n---\nTitle: Second certificate\nIssuer: Institute\nYear: 2024";
  assert.deepEqual(parseBulkContentImport("achievements", text), [
    { title: "First training", description: "Learned new skills.", organization: "Learning Co", date: "May 2025" },
    { title: "Second certificate", description: "", organization: "Institute", date: "2024" },
  ]);
});

test("keeps all entries when a file contains many projects", () => {
  const text = Array.from({ length: 10 }, (_, index) =>
    `Title: Project ${index + 1}\nTechnologies: React, Node.js`,
  ).join("\n--------------------\n");
  const projects = parseBulkContentImport("projects", text);
  assert.equal(projects.length, 10);
  assert.equal(projects[9].title, "Project 10");
  assert.equal(projects[9].technologies, "React, Node.js");
});

test("preserves unrecognized text and accepts incomplete entries for review", () => {
  assert.deepEqual(parseBulkContentImport("projects", "A".repeat(121) + "\nDetails: something"), [
    { title: "", description: "A".repeat(121) + "\nDetails: something" },
  ]);
});

test("rejects duplicate fields and oversized imports without dropping data", () => {
  assert.throws(() => parseBulkContentImport("projects", "Title: One\nTitle: Two"), /Entry 1.*more than one/);
  const text = Array(201).fill("Title: Example").join("\n---\n");
  assert.throws(() => parseBulkContentImport("achievements", text), /up to 200/);
});
