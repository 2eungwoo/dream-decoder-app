import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis, { Redis as RedisClient } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient;

  /*
    redis 기본 명령에서 get 비교, incr expire 순서를 atomic하게 묶을 방법이 없음
    ioredis에도 세마포어 기능이 없음
  
    동시 N개만 허용하는 permit counter 같은 개념이 없으니까 직접 Lua 스크립트 불러서
    임계구역 내에서 race condition 방지 용도로 구현
  
    ioredis에서 Lua 스크립트 커스텀 명령을 defineCommand()로 등록하는 기능은 있음
  */

  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? "6379"),
      password: process.env.REDIS_PASSWORD ?? undefined,
    });

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

  public getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  public async acquireSemaphore(key: string, limit: number, ttl: number) {
    const result = await (this.client as any).acquireSemaphore(key, limit, ttl);
    return Number(result) === 1;
  }

  public async releaseSemaphore(key: string) {
    await (this.client as any).releaseSemaphore(key);
  }
}
