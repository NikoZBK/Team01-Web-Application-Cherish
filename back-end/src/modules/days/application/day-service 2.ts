import type { Clock, IdGenerator } from '../../../shared/application/ports.ts';
import { validationFailed } from '../../../shared/domain/errors.ts';
import { blankDay, type DayContent } from '../domain/day.ts';
import type { DateRange, DayRepository } from './day-repository.ts';

export type DayInput = Omit<DayContent, 'date'>;

/** Days are private: every operation works on the caller's own calendar only. */
export class DayService {
  readonly #days: DayRepository;
  readonly #clock: Clock;
  readonly #ids: IdGenerator;

  constructor(days: DayRepository, clock: Clock, ids: IdGenerator) {
    this.#days = days;
    this.#clock = clock;
    this.#ids = ids;
  }

  /** Every date exists on a calendar, so an unrecorded date reads as a blank day. */
  async get(ownerId: string, date: string): Promise<DayContent> {
    return (await this.#days.findOwned(ownerId, date)) ?? blankDay(date);
  }

  list(ownerId: string, range: DateRange): Promise<DayContent[]> {
    if (range.from !== undefined && range.to !== undefined && range.from > range.to) {
      throw validationFailed('"from" must not be after "to"');
    }
    return this.#days.listOwned(ownerId, range);
  }

  /** Records the whole day, replacing whatever was stored for that date. */
  async save(ownerId: string, date: string, input: DayInput): Promise<DayContent> {
    const now = this.#clock.now();
    const content: DayContent = {
      date,
      rating: input.rating,
      journal: input.journal,
      emotions: input.emotions,
    };
    await this.#days.save({ ...content, id: this.#ids.next(), ownerId, createdAt: now, updatedAt: now });
    return content;
  }

  async clear(ownerId: string): Promise<void> {
    await this.#days.deleteAllOwned(ownerId);
  }
}
