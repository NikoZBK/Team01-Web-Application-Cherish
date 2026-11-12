export const EMOTIONS = ['Happy', 'Sad', 'Angry', 'Anxious', 'Disgusted', 'Neutral'] as const;
export type Emotion = (typeof EMOTIONS)[number];

/** One check-in during a day. */
export interface EmotionEntry {
  readonly emotion: Emotion;
  /** Intensity, 1 (faint) to 10 (overwhelming). */
  readonly magnitude: number;
  readonly description: string;
  /** Wall-clock time of the check-in as the user saw it, e.g. `14:05`. */
  readonly time: string;
}

/** What a user records for one calendar date. */
export interface DayContent {
  /** Calendar date, `YYYY-MM-DD`. A user has at most one day per date. */
  readonly date: string;
  /** 0 means "not rated yet"; otherwise 1 (worst) to 10 (best). */
  readonly rating: number;
  readonly journal: string;
  readonly emotions: readonly EmotionEntry[];
}

export interface Day extends DayContent {
  readonly id: string;
  readonly ownerId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** A date nothing has been recorded for yet. */
export const blankDay = (date: string): DayContent => ({ date, rating: 0, journal: '', emotions: [] });
