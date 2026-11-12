import { addDays } from "./dates.js";
import { dominantEmotion } from "./emotions.js";

/** A day counts as recorded once it has a check-in or a journal entry. */
export const isRecorded = (day) => day.emotions.length > 0 || day.journal.trim() !== "";

/** How many days in a row, ending today (or yesterday, if today is still empty), were recorded. */
export function currentStreak(days, todayIso) {
  const recorded = new Set(days.filter(isRecorded).map((day) => day.date));
  let cursor = recorded.has(todayIso) ? todayIso : addDays(todayIso, -1);
  let streak = 0;
  while (recorded.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Trends over a list of days (oldest first): how many were recorded, the
 * average rating of the rated ones, how often each emotion was checked in,
 * the most frequent one, and the longest run of the same emotion in a row.
 */
export function summarize(days) {
  const recorded = days.filter(isRecorded);
  const rated = recorded.filter((day) => day.rating > 0);
  const checkIns = recorded.flatMap((day) => day.emotions);

  const emotionCounts = {};
  let longestRun = { emotion: null, length: 0 };
  let run = { emotion: null, length: 0 };
  for (const { emotion } of checkIns) {
    emotionCounts[emotion] = (emotionCounts[emotion] ?? 0) + 1;
    run = run.emotion === emotion ? { emotion, length: run.length + 1 } : { emotion, length: 1 };
    if (run.length > longestRun.length) longestRun = run;
  }

  return {
    recordedDays: recorded.length,
    checkIns: checkIns.length,
    averageRating: rated.length === 0 ? null : rated.reduce((sum, day) => sum + day.rating, 0) / rated.length,
    emotionCounts,
    mostFrequentEmotion: dominantEmotion(checkIns),
    longestRun,
    rated,
  };
}
