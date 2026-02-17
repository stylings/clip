import { PasteStore } from "./interface";
import { MemoryStore } from "./memory";
import { RedisStore } from "./redis";

export function createStore(): PasteStore {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log("Using Redis store");
    return new RedisStore(redisUrl);
  }

  console.log("Using in-memory store");
  return new MemoryStore();
}

export type { PasteStore };
