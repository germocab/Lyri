/**
 * localStorageAdapter
 * ---------------------------------------------------------
 * The lowest-level persistence layer. It knows nothing about
 * "notes" or "boards" — it only stores/retrieves a single JSON
 * blob under one key. This is intentional: swapping this file
 * for a Supabase (or any async remote) adapter later should
 * require no changes anywhere else in the app, as long as the
 * new adapter implements the same three methods and returns
 * Promises (this one just resolves immediately).
 *
 * Expected interface for any future adapter:
 *   async load()          -> parsed data or null
 *   async save(data)       -> void
 *   async clear()          -> void
 */

const STORAGE_KEY = 'today-app:v1';

export const localStorageAdapter = {
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('[storage] failed to load', err);
      return null;
    }
  },

  async save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[storage] failed to save', err);
    }
  },

  async clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
