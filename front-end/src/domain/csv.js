import { isRecorded } from "./insights.js";

// A cell starting with one of these would be run as a formula by spreadsheet apps.
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value) {
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The recorded days as CSV text: one row per day. */
export function toCsv(days) {
  const rows = days.filter(isRecorded).map((day) => [
    day.date,
    day.rating > 0 ? day.rating : "",
    day.emotions.map((entry) => `${entry.time} ${entry.emotion} ${entry.magnitude}/10`).join("; "),
    day.journal,
  ]);
  return [["date", "rating", "check-ins", "journal"], ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
