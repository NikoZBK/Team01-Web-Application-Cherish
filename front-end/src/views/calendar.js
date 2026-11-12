import { listDays } from "../api/days.js";
import { addDays, addMonths, formatLong, formatMonth, monthGrid, monthOf, today } from "../domain/dates.js";
import { dominantEmotion, emojiOf, ratingColor } from "../domain/emotions.js";
import { currentStreak, isRecorded } from "../domain/insights.js";
import { quoteFor } from "../domain/quotes.js";
import { h } from "../ui/dom.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Long enough to count any streak a person is likely to have.
const STREAK_WINDOW_DAYS = 400;

function cell(date, day, month, todayIso) {
  const recorded = day !== undefined && isRecorded(day);
  const classes = ["day", date === todayIso && "today", monthOf(date) !== month && "outside", recorded && "recorded"];
  const content = [
    h("span", { class: "number" }, String(Number(date.slice(8)))),
    h("span", { class: "mood", "aria-hidden": "true" }, recorded ? emojiOf(dominantEmotion(day.emotions)) : ""),
  ];

  if (date > todayIso) return h("span", { class: [...classes, "future"].filter(Boolean).join(" ") }, content);

  const label = recorded
    ? `${formatLong(date)}, ${day.emotions.length} check-ins${day.rating > 0 ? `, rated ${day.rating.toFixed(1)} out of 10` : ""}`
    : `${formatLong(date)}, nothing recorded`;
  return h(
    "a",
    {
      class: classes.filter(Boolean).join(" "),
      href: `#/day/${date}`,
      "aria-label": label,
      style: recorded && day.rating > 0 ? `--rating: ${ratingColor(day.rating)}` : null,
    },
    content,
  );
}

/** One month as a grid; each recorded day shows its main mood and a bar coloured by its rating. */
export async function calendarView(month) {
  const todayIso = today();
  const grid = monthGrid(month);

  const [shown, recent] = await Promise.all([
    listDays({ from: grid[0], to: grid.at(-1) }),
    listDays({ from: addDays(todayIso, -STREAK_WINDOW_DAYS), to: todayIso }),
  ]);
  const byDate = new Map(shown.map((day) => [day.date, day]));
  const streak = currentStreak(recent, todayIso);
  const quote = quoteFor(todayIso);

  return [
    h(
      "figure",
      { class: "quote" },
      h("blockquote", null, `“${quote.text}”`),
      h("figcaption", null, `— ${quote.author}`),
    ),
    h(
      "div",
      { class: "toolbar" },
      h("a", { class: "button", href: `#/calendar/${addMonths(month, -1)}`, "aria-label": "Previous month" }, "‹"),
      h("h1", null, formatMonth(month)),
      h("a", { class: "button", href: `#/calendar/${addMonths(month, 1)}`, "aria-label": "Next month" }, "›"),
    ),
    h(
      "p",
      { class: "streak" },
      streak === 0 ? "Check in today to start a streak." : `🔥 ${streak}-day streak`,
      month === monthOf(todayIso) ? null : h("a", { href: "#/calendar" }, "Back to this month"),
    ),
    h(
      "div",
      { class: "calendar" },
      WEEKDAYS.map((name) => h("span", { class: "weekday" }, name)),
      grid.map((date) => cell(date, byDate.get(date), month, todayIso)),
    ),
    h("a", { class: "button primary wide", href: `#/day/${todayIso}` }, "Check in today"),
  ];
}
