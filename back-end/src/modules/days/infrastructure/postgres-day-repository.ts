import type { SqlClient } from '../../../platform/persistence/sql-client.ts';
import type { DateRange, DayRepository } from '../application/day-repository.ts';
import type { Day, EmotionEntry } from '../domain/day.ts';

interface DayRow {
  id: string;
  owner_id: string;
  /** Selected as text: a `date` has no time zone and must not be shifted by one. */
  day_date: string;
  rating: number;
  journal: string;
  emotions: EmotionEntry[];
  created_at: Date;
  updated_at: Date;
}

const SELECT = `select id, owner_id, day_date::text as day_date, rating, journal, emotions, created_at, updated_at
                from days`;

export class PostgresDayRepository implements DayRepository {
  readonly #sql: SqlClient;

  constructor(sql: SqlClient) {
    this.#sql = sql;
  }

  async save(day: Day): Promise<void> {
    await this.#sql.execute(
      `insert into days (id, owner_id, day_date, rating, journal, emotions, created_at, updated_at)
       values ($1, $2, $3::date, $4, $5, $6::jsonb, $7, $8)
       on conflict (owner_id, day_date) do update
         set rating = excluded.rating, journal = excluded.journal,
             emotions = excluded.emotions, updated_at = excluded.updated_at`,
      [day.id, day.ownerId, day.date, day.rating, day.journal, JSON.stringify(day.emotions), day.createdAt, day.updatedAt],
    );
  }

  async findOwned(ownerId: string, date: string): Promise<Day | null> {
    const rows = await this.#sql.query<DayRow>(`${SELECT} where owner_id = $1 and day_date = $2::date`, [
      ownerId,
      date,
    ]);
    return rows[0] ? toDay(rows[0]) : null;
  }

  async listOwned(ownerId: string, range: DateRange): Promise<Day[]> {
    const rows = await this.#sql.query<DayRow>(
      `${SELECT} where owner_id = $1
         and ($2::date is null or day_date >= $2::date)
         and ($3::date is null or day_date <= $3::date)
       order by day_date`,
      [ownerId, range.from ?? null, range.to ?? null],
    );
    return rows.map(toDay);
  }

  deleteAllOwned(ownerId: string): Promise<number> {
    return this.#sql.execute('delete from days where owner_id = $1', [ownerId]);
  }
}

function toDay(row: DayRow): Day {
  return {
    id: row.id,
    ownerId: row.owner_id,
    date: row.day_date,
    rating: row.rating,
    journal: row.journal,
    emotions: row.emotions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
