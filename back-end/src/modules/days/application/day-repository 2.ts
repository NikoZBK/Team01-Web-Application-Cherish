import type { Day } from '../domain/day.ts';

/** Inclusive bounds, `YYYY-MM-DD`; an omitted bound is open. */
export interface DateRange {
  readonly from?: string;
  readonly to?: string;
}

/**
 * Every read and write is scoped by owner, so a day can never be reached
 * through another user's identity even if a caller forgets to check.
 */
export interface DayRepository {
  /**
   * Stores the day, replacing the content of the owner's existing day for
   * that date if there is one (its id and creation time are kept).
   */
  save(day: Day): Promise<void>;
  findOwned(ownerId: string, date: string): Promise<Day | null>;
  /** Oldest first. */
  listOwned(ownerId: string, range: DateRange): Promise<Day[]>;
  /** Resolves with the number of days removed. */
  deleteAllOwned(ownerId: string): Promise<number>;
}
