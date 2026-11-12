import assert from "node:assert/strict";
import { test } from "node:test";

import { toCsv } from "../src/domain/csv.js";
import { addDays, addMonths, isIsoDate, isMonth, monthGrid, toIso } from "../src/domain/dates.js";
import { dominantEmotion, rateDay } from "../src/domain/emotions.js";
import { currentStreak, summarize } from "../src/domain/insights.js";
import { quoteFor } from "../src/domain/quotes.js";

const entry = (emotion, magnitude = 5) => ({ emotion, magnitude, description: "", time: "09:00" });
const day = (date, emotions = [], journal = "") => ({ date, rating: rateDay(emotions), journal, emotions });

test("dates: arithmetic crosses month, year and leap-day boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2028-03-01", -1), "2028-02-29");
  assert.equal(addMonths("2026-01", -1), "2025-12");
  assert.equal(addMonths("2026-11", 2), "2027-01");
  assert.equal(toIso(new Date(2026, 0, 5)), "2026-01-05");
});

test("dates: only real dates and months are accepted", () => {
  assert.ok(isIsoDate("2028-02-29"));
  assert.ok(!isIsoDate("2026-02-30"));
  assert.ok(!isIsoDate("2026-2-3"));
  assert.ok(!isIsoDate("<script>"));
  assert.ok(isMonth("2026-11"));
  assert.ok(!isMonth("2026-13"));
});

test("dates: a month grid is whole weeks starting on Sunday and contains the month", () => {
  const grid = monthGrid("2026-11"); // 1 November 2026 is a Sunday
  assert.equal(grid.length, 35);
  assert.equal(grid[0], "2026-11-01");
  assert.equal(grid.at(-1), "2026-12-05");

  const padded = monthGrid("2026-08"); // starts on a Saturday, needs six weeks
  assert.equal(padded.length, 42);
  assert.equal(padded[0], "2026-07-26");
  assert.ok(padded.includes("2026-08-31"));
});

test("emotions: rating runs from 1 (worst) to 10 (best), 0 when empty", () => {
  assert.equal(rateDay([]), 0);
  assert.equal(rateDay([entry("Happy", 10)]), 10);
  assert.equal(rateDay([entry("Disgusted", 10)]), 1);
  assert.equal(rateDay([entry("Neutral", 7)]), 7);
  const mixed = rateDay([entry("Happy", 8), entry("Sad", 4)]);
  assert.ok(mixed > 1 && mixed < 10);
  assert.ok(rateDay([entry("Happy", 9)]) > rateDay([entry("Happy", 2)]));
});

test("emotions: the dominant emotion is the most frequent, earliest on a tie", () => {
  assert.equal(dominantEmotion([]), null);
  assert.equal(dominantEmotion([entry("Sad"), entry("Happy"), entry("Happy")]), "Happy");
  assert.equal(dominantEmotion([entry("Sad"), entry("Happy")]), "Sad");
});

test("insights: the streak counts back from today, or from yesterday if today is empty", () => {
  const days = [day("2026-11-09", [entry("Happy")]), day("2026-11-10", [], "wrote"), day("2026-11-11", [entry("Sad")])];
  assert.equal(currentStreak(days, "2026-11-11"), 3);
  assert.equal(currentStreak(days, "2026-11-12"), 3);
  assert.equal(currentStreak(days, "2026-11-13"), 0);
  assert.equal(currentStreak([day("2026-11-11")], "2026-11-11"), 0);
});

test("insights: summary counts, averages and finds the longest run", () => {
  const summary = summarize([
    day("2026-11-01", [entry("Happy", 10), entry("Sad")]),
    day("2026-11-02", [entry("Sad"), entry("Sad")]),
    day("2026-11-03", [], "journal only"),
    day("2026-11-04"),
  ]);
  assert.equal(summary.recordedDays, 3);
  assert.equal(summary.checkIns, 4);
  assert.deepEqual(summary.emotionCounts, { Happy: 1, Sad: 3 });
  assert.equal(summary.mostFrequentEmotion, "Sad");
  assert.deepEqual(summary.longestRun, { emotion: "Sad", length: 3 });
  assert.equal(summary.rated.length, 2);
  assert.ok(Math.abs(summary.averageRating - (summary.rated[0].rating + summary.rated[1].rating) / 2) < 1e-9);

  const empty = summarize([]);
  assert.equal(empty.averageRating, null);
  assert.equal(empty.mostFrequentEmotion, null);
});

test("csv: quotes special characters and defuses spreadsheet formulas", () => {
  const csv = toCsv([
    day("2026-11-01", [entry("Happy", 7)], 'He said "hi",\nthen left'),
    day("2026-11-02", [], "=HYPERLINK(evil)"),
    day("2026-11-03"),
  ]);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], "date,rating,check-ins,journal");
  assert.ok(csv.includes('"He said ""hi"",\nthen left"'));
  assert.ok(csv.includes("09:00 Happy 7/10"));
  assert.ok(csv.includes("2026-11-02,,,'=HYPERLINK(evil)"));
  assert.ok(!csv.includes("2026-11-03"));
});

test("quotes: one per day, stable within the day", () => {
  assert.deepEqual(quoteFor("2026-11-12"), quoteFor("2026-11-12"));
  assert.notDeepEqual(quoteFor("2026-11-12"), quoteFor("2026-11-13"));
  assert.ok(quoteFor("1969-12-25").text.length > 0);
});
