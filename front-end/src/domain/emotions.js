/**
 * The emotions a check-in can record. `weight` is how much one point of
 * magnitude moves the day's rating: from +2 (Happy) down to -4 (Disgusted).
 */
export const EMOTIONS = [
  { id: "Happy", emoji: "😊", weight: 2 },
  { id: "Neutral", emoji: "😐", weight: 0 },
  { id: "Anxious", emoji: "😰", weight: -1 },
  { id: "Sad", emoji: "😢", weight: -2 },
  { id: "Angry", emoji: "😠", weight: -3 },
  { id: "Disgusted", emoji: "🤢", weight: -4 },
];

const BY_ID = new Map(EMOTIONS.map((emotion) => [emotion.id, emotion]));

export const emojiOf = (id) => BY_ID.get(id)?.emoji ?? "❔";

export const MIN_MAGNITUDE = 1;
export const MAX_MAGNITUDE = 10;
export const MAX_DESCRIPTION = 250;
export const MAX_JOURNAL = 2000;

const BEST = Math.max(...EMOTIONS.map((emotion) => emotion.weight)) * MAX_MAGNITUDE;
const WORST = Math.min(...EMOTIONS.map((emotion) => emotion.weight)) * MAX_MAGNITUDE;

/**
 * A day's rating from its check-ins: the average of weight × magnitude,
 * rescaled to 1 (worst) … 10 (best). 0 means there is nothing to rate.
 */
export function rateDay(emotions) {
  if (emotions.length === 0) return 0;
  const total = emotions.reduce((sum, entry) => sum + (BY_ID.get(entry.emotion)?.weight ?? 0) * entry.magnitude, 0);
  const rating = ((total / emotions.length - WORST) / (BEST - WORST)) * 9 + 1;
  return Math.round(rating * 100) / 100;
}

/** The emotion checked in most often; the earliest one wins a tie. */
export function dominantEmotion(emotions) {
  const counts = new Map();
  for (const entry of emotions) counts.set(entry.emotion, (counts.get(entry.emotion) ?? 0) + 1);
  let best = null;
  for (const [emotion, count] of counts) if (best === null || count > counts.get(best)) best = emotion;
  return best;
}

/** A colour from red (1) to green (10) for a rating. */
export const ratingColor = (rating) => `hsl(${Math.round(((rating - 1) / 9) * 125)} 62% 45%)`;
