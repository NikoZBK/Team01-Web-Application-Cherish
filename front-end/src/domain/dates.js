/** Calendar dates are handled as "YYYY-MM-DD" strings in the user's own time zone. */

const pad = (number) => String(number).padStart(2, "0");

export const toIso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function fromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export const isIsoDate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text) && toIso(fromIso(text)) === text;

export const today = () => toIso(new Date());

export function addDays(iso, count) {
  const date = fromIso(iso);
  date.setDate(date.getDate() + count);
  return toIso(date);
}

/** "14:05" */
export const timeOf = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatLong = (iso) =>
  fromIso(iso).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export const formatShort = (iso) => fromIso(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** "2026-11" */
export const monthOf = (iso) => iso.slice(0, 7);

export const isMonth = (text) => /^\d{4}-(0[1-9]|1[0-2])$/.test(text);

export function addMonths(month, count) {
  const [year, index] = month.split("-").map(Number);
  return monthOf(toIso(new Date(year, index - 1 + count, 1)));
}

export const formatMonth = (month) =>
  fromIso(`${month}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

/**
 * The dates shown for a month: whole weeks, Sunday first, padded with the
 * neighbouring months' days.
 */
export function monthGrid(month) {
  const first = fromIso(`${month}-01`);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  const start = addDays(`${month}-01`, -first.getDay());
  return Array.from({ length: cells }, (_, index) => addDays(start, index));
}
