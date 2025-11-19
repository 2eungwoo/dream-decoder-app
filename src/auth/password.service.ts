import { Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordService {
  public hash(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 32).toString('hex');
    return `${salt}:${derived}`;
  }

  public verify(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) {
      return false;
    }

    const derived = scryptSync(password, salt, 32);
    const existing = Buffer.from(hash, 'hex');
    return (
      derived.length === existing.length && timingSafeEqual(derived, existing)
    );
  }
}
