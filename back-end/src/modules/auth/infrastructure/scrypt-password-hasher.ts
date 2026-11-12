import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { PasswordHasher } from '../application/ports.ts';

const SCHEME = 'scrypt';
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const MIN_COST = 10;
const MAX_COST = 20;

/**
 * scrypt (memory-hard, built into Node). Hashes are self-describing
 * (`scrypt$<cost>$<salt>$<key>`) so the cost can be raised without
 * invalidating existing passwords.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  readonly #cost: number;

  constructor(cost: number) {
    if (!Number.isInteger(cost) || cost < MIN_COST || cost > MAX_COST) {
      throw new RangeError(`scrypt cost must be an integer between ${MIN_COST} and ${MAX_COST}`);
    }
    this.#cost = cost;
  }

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await derive(plain, salt, this.#cost);
    return [SCHEME, this.#cost, salt.toString('base64url'), key.toString('base64url')].join('$');
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    const [scheme, costText, saltText, keyText] = hash.split('$');
    const cost = Number(costText);
    if (scheme !== SCHEME || !saltText || !keyText) return false;
    if (!Number.isInteger(cost) || cost < MIN_COST || cost > MAX_COST) return false;

    const expected = Buffer.from(keyText, 'base64url');
    if (expected.length !== KEY_BYTES) return false;
    const actual = await derive(plain, Buffer.from(saltText, 'base64url'), cost);
    return timingSafeEqual(actual, expected);
  }
}

function derive(plain: string, salt: Buffer, cost: number): Promise<Buffer> {
  const N = 2 ** cost;
  const options: ScryptOptions = { N, r: BLOCK_SIZE, p: PARALLELISM, maxmem: 256 * N * BLOCK_SIZE };
  return new Promise((resolve, reject) => {
    scrypt(plain.normalize('NFKC'), salt, KEY_BYTES, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}
