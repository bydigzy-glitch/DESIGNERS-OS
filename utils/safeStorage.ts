/**
 * Safe localStorage wrapper that handles QuotaExceededError
 * Falls back to in-memory storage when localStorage is full
 */

const memoryStorage: Record<string, string> = {};
let isLocalStorageAvailable = true;

// Test localStorage availability
try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
} catch (e) {
    isLocalStorageAvailable = false;
    console.warn('[SafeStorage] localStorage not available, using memory storage');
}

export const safeStorage = {
    getItem: (key: string): string | null => {
        try {
            if (isLocalStorageAvailable) {
                return localStorage.getItem(key);
            }
            return memoryStorage[key] || null;
        } catch (e) {
            console.error('[SafeStorage] Error reading from storage:', e);
            return memoryStorage[key] || null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        try {
            if (isLocalStorageAvailable) {
                localStorage.setItem(key, value);
                return true;
            }
            memoryStorage[key] = value;
            return true;
        } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                console.error('[SafeStorage] localStorage quota exceeded!');
                // Try to clear old data
                try {
                    clearOldData();
                    localStorage.setItem(key, value);
                    return true;
                } catch (retryError) {
                    // Fall back to memory storage
                    console.warn('[SafeStorage] Falling back to memory storage');
                    isLocalStorageAvailable = false;
                    memoryStorage[key] = value;
                    return false;
                }
            }
            console.error('[SafeStorage] Error writing to storage:', e);
            memoryStorage[key] = value;
            return false;
        }
    },

    removeItem: (key: string): void => {
        try {
            if (isLocalStorageAvailable) {
                localStorage.removeItem(key);
            }
            delete memoryStorage[key];
        } catch (e) {
            console.error('[SafeStorage] Error removing from storage:', e);
            delete memoryStorage[key];
        }
    },

    clear: (): void => {
        try {
            if (isLocalStorageAvailable) {
                localStorage.clear();
            }
            Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
        } catch (e) {
            console.error('[SafeStorage] Error clearing storage:', e);
        }
    },

    /**
     * Get current storage usage in bytes
     */
    getUsage: (): number => {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Get storage usage as a percentage (assuming 5MB limit)
     */
    getUsagePercent: (): number => {
        const usage = safeStorage.getUsage();
        const limit = 5 * 1024 * 1024; // 5MB
        return Math.round((usage / limit) * 100);
    }
};

/**
 * Clear old/unused data from localStorage
 */
function clearOldData(): void {
    try {
        // Remove old version data
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                // Remove old app versions data
                if (key.includes('_v1_') || key.includes('_v2_') || key.includes('old_')) {
                    keysToRemove.push(key);
                }
                // Remove very large items (> 500KB)
                const value = localStorage.getItem(key);
                if (value && value.length > 500000) {
                    console.warn(`[SafeStorage] Removing large item: ${key} (${Math.round(value.length / 1024)}KB)`);
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[SafeStorage] Cleared ${keysToRemove.length} old items`);
    } catch (e) {
        console.error('[SafeStorage] Error clearing old data:', e);
    }
}

export default safeStorage;
