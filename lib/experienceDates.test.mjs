import { strict as assert } from "node:assert";
import { test } from "node:test";
import { formatExperienceDateRange } from "./experienceDates.js";

test("shows Present for current experience ranges", () => {
  assert.equal(
    formatExperienceDateRange({
      startDate: "2024-01",
      endDate: "",
      datePrecision: "year",
      isCurrent: true,
    }),
    "2024 – Present",
  );
  assert.equal(
    formatExperienceDateRange({
      startDate: "2024-05",
      endDate: "",
      datePrecision: "month",
      isCurrent: true,
    }),
    "May 2024 – Present",
  );
});

test("keeps end dates for completed experience and supports legacy ranges", () => {
  assert.equal(
    formatExperienceDateRange({
      startDate: "2022-05",
      endDate: "2024-01",
      datePrecision: "month",
      isCurrent: false,
    }),
    "May 2022 – Jan 2024",
  );
  assert.equal(
    formatExperienceDateRange({ date: "2024 - Present" }),
    "2024 – Present",
  );
});
