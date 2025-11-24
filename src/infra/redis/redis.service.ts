import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis, { Redis as RedisClient } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient;

  async onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? "6379"),
      password: process.env.REDIS_PASSWORD ?? undefined,
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
}
