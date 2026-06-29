/**
 * Safe wrapper for localStorage to prevent DOMException crashes
 * in restricted environments or when storage is full.
 */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to get ${key}:`, e);
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`[SafeStorage] Failed to set ${key}:`, e);
      // If it's QuotaExceededError, we might want to clear some stuff, 
      // but for now we just return false to let the caller handle it.
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove ${key}:`, e);
      return false;
    }
  },

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('[SafeStorage] Failed to clear storage:', e);
      return false;
    }
  }
};
