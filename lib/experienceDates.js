const monthNumbers = new Map([
  ["jan", "01"],
  ["feb", "02"],
  ["mar", "03"],
  ["apr", "04"],
  ["may", "05"],
  ["jun", "06"],
  ["jul", "07"],
  ["aug", "08"],
  ["sep", "09"],
  ["oct", "10"],
  ["nov", "11"],
  ["dec", "12"],
]);

function parseDatePart(value) {
  const normalized = value.trim().replace(",", "");
  const numericMonth = normalized.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (numericMonth) {
    return {
      value: `${numericMonth[1]}-${numericMonth[2]}`,
      precision: "month",
    };
  }

  const namedMonth = normalized.match(/^([a-z]+)\s+(\d{4})$/i);
  if (namedMonth) {
    const month = monthNumbers.get(namedMonth[1].slice(0, 3).toLowerCase());
    if (month) {
      return {
        value: `${namedMonth[2]}-${month}`,
        precision: "month",
      };
    }
  }

  const year = normalized.match(/^(\d{4})$/);
  if (year) {
    return { value: year[1], precision: "year" };
  }

  return null;
}

export function parseExperienceDateRange(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim();
  const range =
    normalized.match(/^(.+?)\s+(?:-|–|—|to)\s+(.+)$/i) ||
    normalized.match(/^(\d{4})[-–—](\d{4})$/);
  if (!range) return null;

  const start = parseDatePart(range[1]);
  const endIsPresent = /^(present|current|now)$/i.test(range[2].trim());
  const end = endIsPresent ? null : parseDatePart(range[2]);
  if (!start || (!end && !endIsPresent)) return null;

  const startDate =
    start.precision === "year" ? `${start.value}-01` : start.value;
  const endDate = end
    ? end.precision === "year"
      ? `${end.value}-12`
      : end.value
    : "";
  const datePrecision =
    start.precision === "year" &&
    (!end || end.precision === "year")
      ? "year"
      : "month";

  return { startDate, endDate, datePrecision };
}

export function formatExperienceMonth(value) {
  const match = typeof value === "string" && value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return "";

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[Number(match[2]) - 1]} ${match[1]}`;
}

export function formatExperienceDateRange(item) {
  const parsedLegacyDate = item?.startDate
    ? null
    : parseExperienceDateRange(item?.date);
  const experience = parsedLegacyDate
    ? { ...item, ...parsedLegacyDate }
    : item;
  const startDate = formatExperienceMonth(experience?.startDate);
  if (!startDate) return experience?.date || "";
  const isCurrent = experience.isCurrent ?? !experience.endDate;

  if (experience.datePrecision === "year") {
    const endYear = experience.endDate?.slice(0, 4);
    return endYear
      ? `${experience.startDate.slice(0, 4)} – ${endYear}`
      : isCurrent
        ? `${experience.startDate.slice(0, 4)} – Present`
        : experience.startDate.slice(0, 4);
  }

  const endDate = experience.endDate
    ? formatExperienceMonth(experience.endDate)
    : "";
  return endDate
    ? `${startDate} – ${endDate}`
    : isCurrent
      ? `${startDate} – Present`
      : startDate;
}
