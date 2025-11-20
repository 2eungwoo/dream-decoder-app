import { Injectable, Logger } from "@nestjs/common";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class InterpretationCacheService {
  private readonly logger = new Logger(InterpretationCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs = Number(
    process.env.INTERPRET_CACHE_TTL_MS ?? "300000"
  );

  public get(key: string) {
    const cached = this.store.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.logger.debug(`[Cache] Cache expired for key=${key}`);
      this.store.delete(key);
      return null;
    }

    this.logger.debug(`[Cache] Cache hit for key=${key}`);
    return cached.value;
  }

  public set(key: string, value: string) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public createKey(payload: unknown) {
    return JSON.stringify(payload);
  }
}
