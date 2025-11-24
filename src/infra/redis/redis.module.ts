import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { RedisSemaphoreService } from "./redis-semaphore.service";

@Global()
@Module({
  providers: [RedisService, RedisSemaphoreService],
  exports: [RedisService, RedisSemaphoreService],
})
export class RedisModule {}
