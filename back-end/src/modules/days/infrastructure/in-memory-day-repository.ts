import type { DateRange, DayRepository } from '../application/day-repository.ts';
import type { Day } from '../domain/day.ts';

export class InMemoryDayRepository implements DayRepository {
  /** owner id -> date -> day */
  readonly #byOwner = new Map<string, Map<string, Day>>();

  async save(day: Day): Promise<void> {
    const days = this.#byOwner.get(day.ownerId) ?? new Map<string, Day>();
    const existing = days.get(day.date);
    days.set(
      day.date,
      structuredClone(existing ? { ...day, id: existing.id, createdAt: existing.createdAt } : day),
    );
    this.#byOwner.set(day.ownerId, days);
  }

  async findOwned(ownerId: string, date: string): Promise<Day | null> {
    const day = this.#byOwner.get(ownerId)?.get(date);
    return day ? structuredClone(day) : null;
  }

  async listOwned(ownerId: string, range: DateRange): Promise<Day[]> {
    return [...(this.#byOwner.get(ownerId)?.values() ?? [])]
      .filter((day) => (range.from === undefined || day.date >= range.from) && (range.to === undefined || day.date <= range.to))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((day) => structuredClone(day));
  }

  async deleteAllOwned(ownerId: string): Promise<number> {
    const count = this.#byOwner.get(ownerId)?.size ?? 0;
    this.#byOwner.delete(ownerId);
    return count;
  }
}
