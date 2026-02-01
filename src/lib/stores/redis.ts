import Redis from "iovalkey";
import { PasteStore } from "./interface";

export class RedisStore implements PasteStore {
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url);
  }

  async get(id: string): Promise<string | null> {
    return this.client.get(`paste:${id}`);
  }

  async set(id: string, value: string): Promise<void> {
    await this.client.set(`paste:${id}`, value);
  }
}
