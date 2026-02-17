import { PasteStore } from "./interface";
import { MemoryStore } from "./memory";
import { RedisStore } from "./redis";

export function createStore(): PasteStore {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    return new RedisStore(redisUrl);
  }

  return new MemoryStore();
}

export type { PasteStore };
