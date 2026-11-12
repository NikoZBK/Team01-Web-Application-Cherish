import { listDays } from "../api/days.js";
import { addDays, formatShort, today } from "../domain/dates.js";
import { EMOTIONS, emojiOf, ratingColor } from "../domain/emotions.js";
import { summarize } from "../domain/insights.js";
import { h, mount, svg } from "../ui/dom.js";

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "90", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

const stat = (label, value, note) =>
  h("div", { class: "stat" }, h("span", { class: "muted" }, label), h("strong", null, value), note ? h("span", { class: "muted" }, note) : null);

/** Line chart of ratings (1–10) over the rated days. */
function ratingChart(rated) {
  const width = 600;
  const height = 180;
  const pad = 12;
  const x = (index) => (rated.length === 1 ? width / 2 : pad + (index / (rated.length - 1)) * (width - 2 * pad));
  const y = (rating) => height - pad - ((rating - 1) / 9) * (height - 2 * pad);

  return h(
    "figure",
    { class: "chart" },
    svg(
      "svg",
      {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": `Ratings from ${formatShort(rated[0].date)} to ${formatShort(rated.at(-1).date)}`,
      },
      [1, 5.5, 10].map((level) => svg("line", { class: "grid", x1: pad, x2: width - pad, y1: y(level), y2: y(level) })),
      svg("polyline", { class: "line", points: rated.map((day, index) => `${x(index)},${y(day.rating)}`).join(" ") }),
      rated.map((day, index) =>
        svg(
          "circle",
          { cx: x(index), cy: y(day.rating), r: 4, fill: ratingColor(day.rating) },
          svg("title", null, `${formatShort(day.date)}: ${day.rating.toFixed(1)}`),
        ),
      ),
    ),
    h("figcaption", { class: "row muted" }, h("span", null, formatShort(rated[0].date)), h("span", null, formatShort(rated.at(-1).date))),
  );
}

function emotionBars(counts, total) {
  return h(
    "ul",
    { class: "bars" },
    EMOTIONS.filter((emotion) => counts[emotion.id] > 0)
      .sort((a, b) => counts[b.id] - counts[a.id])
      .map((emotion) =>
        h(
          "li",
          null,
          h("span", null, `${emotion.emoji} ${emotion.id}`),
          h("span", { class: "bar" }, h("span", { style: `width: ${(counts[emotion.id] / total) * 100}%` })),
          h("span", { class: "muted" }, String(counts[emotion.id])),
        ),
      ),
  );
}

function report(days) {
  const summary = summarize(days);
  if (summary.recordedDays === 0) {
    return h("p", { class: "muted" }, "Nothing recorded in this period yet. ", h("a", { href: "#/day" }, "Check in today"), ".");
  }
  const { longestRun, mostFrequentEmotion: top } = summary;
  return [
    h(
      "div",
      { class: "stats" },
      stat("Days recorded", String(summary.recordedDays), `${summary.checkIns} check-ins`),
      stat("Average rating", summary.averageRating === null ? "—" : summary.averageRating.toFixed(1), "out of 10"),
      stat("Most frequent", top ? `${emojiOf(top)} ${top}` : "—", top ? `${summary.emotionCounts[top]} times` : null),
      stat(
        "Longest run",
        longestRun.emotion ? `${emojiOf(longestRun.emotion)} × ${longestRun.length}` : "—",
        longestRun.emotion ? `${longestRun.emotion} in a row` : null,
      ),
    ),
    summary.rated.length > 0 ? h("section", { class: "card" }, h("h2", null, "Rating over time"), ratingChart(summary.rated)) : null,
    summary.checkIns > 0
      ? h("section", { class: "card" }, h("h2", null, "Emotions"), emotionBars(summary.emotionCounts, summary.checkIns))
      : null,
  ];
}

/** Trends over a period the user picks. */
export async function insightsView() {
  const body = h("div", { class: "stack" });
  const buttons = h("div", { class: "segmented", role: "group", "aria-label": "Period" });
  let request = 0;

  async function show(range) {
    const turn = ++request;
    mount(
      buttons,
      RANGES.map((option) =>
        h("button", { type: "button", "aria-pressed": String(option === range), onclick: () => show(option) }, option.label),
      ),
    );
    const todayIso = today();
    const days = await listDays(range.days === null ? {} : { from: addDays(todayIso, 1 - range.days), to: todayIso });
    if (turn === request) mount(body, report(days));
  }

  await show(RANGES[1]);
  return [h("h1", null, "Insights"), buttons, body];
}
