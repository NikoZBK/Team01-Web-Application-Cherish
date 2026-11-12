import { createHash, randomBytes } from 'node:crypto';
import type { OpaqueTokenFactory } from '../application/ports.ts';

const TOKEN_BYTES = 32;

/** 256-bit random tokens; a plain SHA-256 digest is sufficient at this entropy. */
export class Sha256OpaqueTokenFactory implements OpaqueTokenFactory {
  generate(): { token: string; digest: string } {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    return { token, digest: this.digestOf(token) };
  }

  digestOf(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
