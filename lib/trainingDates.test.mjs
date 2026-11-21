import { strict as assert } from "node:assert";
import { test } from "node:test";
import { sortTrainingByDate } from "./trainingDates.mjs";

test("sorts training dates newest first without changing the source", () => {
  const items = [
    { date: "October 2024" },
    { date: "2025" },
    { date: "June 2025" },
    { date: "November 2025" },
    { date: "June 2025" },
    { date: "2025-11-30" },
  ];
  assert.deepEqual(sortTrainingByDate(items), [items[5], items[3], items[2], items[4], items[1], items[0]]);
  assert.equal(items[0].date, "October 2024");
});

test("places missing and invalid dates last in their original order", () => {
  const items = [
    { date: "unknown" },
    { date: "2024-02-29" },
    { date: "2023-02-29" },
    { date: "" },
    { date: "Sept 2023" },
    { date: "June 31, 2025" },
    { date: "May 10, 2025" },
  ];
  assert.deepEqual(sortTrainingByDate(items), [items[6], items[1], items[4], items[0], items[2], items[3], items[5]]);
});
