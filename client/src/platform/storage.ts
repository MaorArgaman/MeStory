import { Preferences } from '@capacitor/preferences';
import { isNative } from './index';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      await Preferences.set({ key, value });
      return;
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isNative) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    if (isNative) {
      await Preferences.clear();
      return;
    }
    localStorage.clear();
  },
};

export function syncStorageGet(key: string): string | null {
  if (isNative) {
    return localStorage.getItem(key);
  }
  return localStorage.getItem(key);
}

export function syncStorageSet(key: string, value: string): void {
  localStorage.setItem(key, value);
  if (isNative) {
    void Preferences.set({ key, value });
  }
}

export function syncStorageRemove(key: string): void {
  localStorage.removeItem(key);
  if (isNative) {
    void Preferences.remove({ key });
  }
}

export async function hydrateStorageFromNative(keys: string[]): Promise<void> {
  if (!isNative) return;
  await Promise.all(
    keys.map(async (k) => {
      const { value } = await Preferences.get({ key: k });
      if (value != null && localStorage.getItem(k) == null) {
        localStorage.setItem(k, value);
      }
    }),
  );
}
