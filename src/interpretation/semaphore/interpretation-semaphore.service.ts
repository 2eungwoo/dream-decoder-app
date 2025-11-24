import { Injectable } from "@nestjs/common";
import { RedisSemaphoreService } from "../../infra/redis/redis-semaphore.service";

const SEMAPHORE_KEY = "interpretation:semaphore";
const SEMAPHORE_LIMIT = Number(process.env.INTERPRET_SEMAPHORE_LIMIT ?? "5");
const SEMAPHORE_TTL = Number(process.env.INTERPRET_SEMAPHORE_TTL ?? "10");

@Injectable()
export class InterpretationSemaphoreService {
  constructor(private readonly redisSemaphore: RedisSemaphoreService) {}

  public acquire() {
    return this.redisSemaphore.acquire(
      SEMAPHORE_KEY,
      SEMAPHORE_LIMIT,
      SEMAPHORE_TTL
    );
  }

  public release() {
    return this.redisSemaphore.release(SEMAPHORE_KEY);
  }
}
