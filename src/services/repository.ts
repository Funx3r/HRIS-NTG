export interface Repository<T> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
}

export interface LocalRepositoryOptions<T> {
  key: string;
  seed: T[];
  idOf: (item: T) => string;
}

export function createLocalRepository<T>(options: {
  key: string;
  seed: T[];
  idOf: (item: T) => string;
}): Repository<T> {
  const { key, seed, idOf } = options;

  const readStorage = (): T[] => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return JSON.parse(JSON.stringify(seed));
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(seed));
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    try {
      return JSON.parse(raw) as T[];
    } catch {
      throw new Error(`CORRUPT: Failed to parse data for key "${key}"`);
    }
  };

  const writeStorage = (items: T[]): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(items));
    }
  };

  return {
    async list(): Promise<T[]> {
      const items = readStorage();
      return JSON.parse(JSON.stringify(items));
    },

    async get(id: string): Promise<T | null> {
      const items = readStorage();
      const targetId = id.trim().toLowerCase();
      const found = items.find((item) => idOf(item).trim().toLowerCase() === targetId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    async create(item: T): Promise<T> {
      const items = readStorage();
      const targetId = idOf(item).trim().toLowerCase();
      const exists = items.some((i) => idOf(i).trim().toLowerCase() === targetId);
      if (exists) {
        throw new Error(`DUPLICATE: Item with ID "${idOf(item)}" already exists.`);
      }

      const itemCopy = JSON.parse(JSON.stringify(item));
      items.push(itemCopy);
      writeStorage(items);
      return itemCopy;
    },

    async update(id: string, patch: Partial<T>): Promise<T> {
      const items = readStorage();
      const targetId = id.trim().toLowerCase();
      const index = items.findIndex((i) => idOf(i).trim().toLowerCase() === targetId);
      if (index === -1) {
        throw new Error(`NOT_FOUND: Item with ID "${id}" was not found.`);
      }

      const updated = { ...items[index], ...patch };
      items[index] = updated;
      writeStorage(items);
      return JSON.parse(JSON.stringify(updated));
    },
  };
}
