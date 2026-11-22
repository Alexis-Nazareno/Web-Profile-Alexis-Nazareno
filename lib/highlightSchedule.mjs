const manilaOffsetMilliseconds = 8 * 60 * 60 * 1000;
const dateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const scheduleFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
});

function parseManilaDateTime(value) {
  const match = dateTimePattern.exec(value || "");
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(wallClock);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return wallClock - manilaOffsetMilliseconds;
}

export function getHighlightSchedule(item = {}) {
  const date = datePattern.test(item.date || "") ? item.date : "";
  const startsAt = item.startsAt || (date ? `${date}T00:00` : "");
  const endsAt = item.endsAt || (date ? `${date}T23:59` : "");
  const startMs = parseManilaDateTime(startsAt);
  const endMs = parseManilaDateTime(endsAt);

  if (startMs === null || endMs === null || endMs < startMs) return null;

  return {
    startsAt,
    endsAt,
    startMs,
    endMs,
    endExclusiveMs: endMs + 60_000,
  };
}

export function isHighlightActive(item, now = Date.now()) {
  const schedule = getHighlightSchedule(item);
  return Boolean(
    schedule &&
      now >= schedule.startMs &&
      now < schedule.endExclusiveMs,
  );
}

export function isHighlightEnded(item, now = Date.now()) {
  const schedule = getHighlightSchedule(item);
  return Boolean(schedule && now >= schedule.endExclusiveMs);
}

export function formatManilaSchedule(schedule) {
  if (!schedule) return "";
  return `${scheduleFormatter.format(new Date(schedule.startMs))} – ${scheduleFormatter.format(new Date(schedule.endMs))}`;
}
