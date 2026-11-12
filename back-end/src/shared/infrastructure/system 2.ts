import { randomBytes } from 'node:crypto';
import type { Clock, IdGenerator } from '../application/ports.ts';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * UUIDv7: 48-bit millisecond timestamp followed by 74 random bits.
 * Unguessable like v4, but time-ordered so database indexes stay compact.
 * Identifiers from one generator are strictly increasing, even within the
 * same millisecond or when the clock steps backwards.
 */
export class UuidV7Generator implements IdGenerator {
  readonly #clock: Clock;
  #lastTimestamp = 0;

  constructor(clock: Clock) {
    this.#clock = clock;
  }

  next(): string {
    const bytes = randomBytes(16);
    this.#lastTimestamp = Math.max(this.#clock.now().getTime(), this.#lastTimestamp + 1);
    bytes.writeUIntBE(this.#lastTimestamp, 0, 6);
    bytes[6] = 0x70 | (bytes[6]! & 0x0f);
    bytes[8] = 0x80 | (bytes[8]! & 0x3f);
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
