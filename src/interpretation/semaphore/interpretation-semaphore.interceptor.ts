import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from } from "rxjs";
import { finalize, switchMap } from "rxjs/operators";
import { RedisService } from "../../infra/redis/redis.service";
import { InterpretationThrottleException } from "../exceptions/interpretation-throttle.exception";

const SEMAPHORE_KEY = "interpretation:semaphore";
const SEMAPHORE_LIMIT = Number(process.env.INTERPRET_SEMAPHORE_LIMIT ?? "5");
const SEMAPHORE_TTL = Number(process.env.INTERPRET_SEMAPHORE_TTL ?? "10");

@Injectable()
export class InterpretationSemaphoreInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return from(this.acquireSlot()).pipe(
      switchMap((acquired) => {
        if (!acquired) {
          throw new InterpretationThrottleException();
        }

        return next.handle().pipe(
          finalize(async () => {
            await this.redisService.releaseSemaphore(SEMAPHORE_KEY);
          })
        );
      })
    );
  }

  private acquireSlot() {
    return this.redisService.acquireSemaphore(
      SEMAPHORE_KEY,
      SEMAPHORE_LIMIT,
      SEMAPHORE_TTL
    );
  }
}
