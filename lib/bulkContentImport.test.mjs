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

test("parses experience entries and treats a present end date as current", () => {
  const text = "Role: Software Engineer\nCompany: Acme Inc.\nStart date: 2024\nEnd date: Present\nDescription: Built web applications.\n---\nTitle: Product Designer\nOrganization: Example Co\nStart date: 2020\nEnd date: 2022";
  assert.deepEqual(parseBulkContentImport("experience", text), [
    {
      title: "Software Engineer",
      description: "Built web applications.",
      organization: "Acme Inc.",
      startDate: "2024",
      endDate: "",
      isCurrent: true,
      datePrecision: "year",
    },
    {
      title: "Product Designer",
      description: "",
      organization: "Example Co",
      startDate: "2020",
      endDate: "2022",
      isCurrent: false,
      datePrecision: "year",
    },
  ]);
});

test("parses scheduled holiday and event entries with Manila date-times", () => {
  const text =
    "Type: Holiday\nTitle: New Year\nShow from: 2027-01-01 00:00\nShow until: 2027-01-01 23:59\nDescription: Welcome the new year.\nWhy it matters: A fresh start.\nLink: https://example.com\n---\nType: Event\nTitle: Valentine's Day\nShow from: 2027-02-14T10:30\nShow until: 2027-02-14T12:00\nDescription: Celebrate together.";
  assert.deepEqual(parseBulkContentImport("highlights", text), [
    {
      title: "New Year",
      description: "Welcome the new year.",
      kind: "holiday",
      startsAt: "2027-01-01T00:00",
      endsAt: "2027-01-01T23:59",
      link: "https://example.com",
      significance: "A fresh start.",
    },
    {
      title: "Valentine's Day",
      description: "Celebrate together.",
      kind: "event",
      startsAt: "2027-02-14T10:30",
      endsAt: "2027-02-14T12:00",
      link: "",
      significance: "",
    },
  ]);
});

test("rejects unknown holiday and event types", () => {
  assert.throws(
    () =>
      parseBulkContentImport(
        "highlights",
        "Type: Celebration\nTitle: New Year\nShow from: 2027-01-01 00:00\nShow until: 2027-01-01 23:59",
      ),
    /Type must be Holiday or Event/,
  );
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
