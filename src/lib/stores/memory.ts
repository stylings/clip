import { PasteStore } from "./interface";

export class MemoryStore implements PasteStore {
  private store = new Map<string, string>();

  async get(id: string): Promise<string | null> {
    return this.store.get(id) || null;
  }

  async set(id: string, value: string): Promise<void> {
    this.store.set(id, value);
  }
}
