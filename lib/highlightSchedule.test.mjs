import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  formatManilaSchedule,
  getHighlightSchedule,
  isHighlightActive,
  isHighlightEnded,
} from "./highlightSchedule.mjs";

test("keeps a Manila all-day event visible through the final minute", () => {
  const event = {
    startsAt: "2026-01-01T00:00",
    endsAt: "2026-01-01T23:59",
  };
  const schedule = getHighlightSchedule(event);

  assert.ok(schedule);
  assert.equal(isHighlightActive(event, schedule.startMs - 1), false);
  assert.equal(isHighlightActive(event, schedule.startMs), true);
  assert.equal(isHighlightActive(event, schedule.endMs + 59_999), true);
  assert.equal(isHighlightActive(event, schedule.endExclusiveMs), false);
  assert.equal(isHighlightEnded(event, schedule.endExclusiveMs), true);
});

test("uses a legacy date as a Manila all-day schedule", () => {
  const schedule = getHighlightSchedule({ date: "2026-01-01" });

  assert.equal(schedule?.startsAt, "2026-01-01T00:00");
  assert.equal(schedule?.endsAt, "2026-01-01T23:59");
  assert.equal(
    formatManilaSchedule(schedule),
    "Jan 1, 2026, 12:00 AM – Jan 1, 2026, 11:59 PM",
  );
});

test("rejects missing, invalid, and reversed schedules", () => {
  assert.equal(getHighlightSchedule(), null);
  assert.equal(
    getHighlightSchedule({
      startsAt: "2026-02-30T00:00",
      endsAt: "2026-02-30T23:59",
    }),
    null,
  );
  assert.equal(
    getHighlightSchedule({
      startsAt: "2026-01-02T00:00",
      endsAt: "2026-01-01T23:59",
    }),
    null,
  );
});
