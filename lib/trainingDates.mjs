const months = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function trainingDateKey(value) {
  if (typeof value !== "string") return null;
  const date = value.trim();
  const numeric = date.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  const named = date.match(/^([a-z]+)\s+(?:(\d{1,2}),?\s+)?(\d{4})$/i);
  let year;
  let month;
  let day;

  if (numeric) {
    year = Number(numeric[1]);
    month = Number(numeric[2] || 1);
    day = Number(numeric[3] || 1);
  } else if (named) {
    const name = named[1].toLowerCase();
    month = months.findIndex((entry) => entry === name || entry.slice(0, 3) === name || (entry === "september" && name === "sept")) + 1;
    year = Number(named[3]);
    day = Number(named[2] || 1);
  } else {
    return null;
  }

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > daysInMonth[month - 1]) return null;
  return year * 10000 + month * 100 + day;
}

export function sortTrainingByDate(items) {
  return items
    .map((item, index) => ({ item, index, date: trainingDateKey(item.date) }))
    .sort((a, b) => {
      if (a.date === null) return b.date === null ? a.index - b.index : 1;
      if (b.date === null) return -1;
      return b.date - a.date || a.index - b.index;
    })
    .map(({ item }) => item);
}
