import { Injectable, OnModuleInit } from "@nestjs/common";
import { Redis } from "ioredis";
import { RedisService } from "./redis.service";

@Injectable()
export class RedisSemaphoreService implements OnModuleInit {
  private client!: Redis;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    this.client = this.redisService.getClient();
    this.defineCommands();
  }

  private defineCommands() {
    this.client.defineCommand("acquireSemaphore", {
      numberOfKeys: 1,
      lua: `
        local current = redis.call("GET", KEYS[1])
        local limit = tonumber(ARGV[1])
        local ttl = tonumber(ARGV[2])

        if current == false then
          redis.call("SET", KEYS[1], 1, "EX", ttl)
          return 1
        end

        current = tonumber(current)
        if current >= limit then
          return 0
        end

        redis.call("INCR", KEYS[1])
        redis.call("EXPIRE", KEYS[1], ttl)
        return 1
      `,
    });

    this.client.defineCommand("releaseSemaphore", {
      numberOfKeys: 1,
      lua: `
        if redis.call("EXISTS", KEYS[1]) == 1 then
          return redis.call("DECR", KEYS[1])
        end
        return 0
      `,
    });
  }

  public async acquire(key: string, limit: number, ttl: number) {
    const result = await (this.client as any).acquireSemaphore(key, limit, ttl);
    return Number(result) === 1;
  }

  public async release(key: string) {
    await (this.client as any).releaseSemaphore(key);
  }
}
