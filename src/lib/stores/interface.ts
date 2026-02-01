export interface PasteStore {
  get(id: string): Promise<string | null>;
  set(id: string, value: string): Promise<void>;
}
