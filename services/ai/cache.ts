/**
 * AI Cache
 * Simple in-memory cache for AI responses with TTL
 */

import { AIToolOutput } from './types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

interface CacheEntry {
    output: AIToolOutput;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Clean expired entries
 */
const cleanExpired = (): void => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            cache.delete(key);
        }
    }
};

/**
 * Enforce max cache size (LRU-like)
 */
const enforceMaxSize = (): void => {
    if (cache.size <= MAX_CACHE_SIZE) return;

    // Remove oldest entries
    const entries = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
};

export const aiCache = {
    /**
     * Get cached output by hash
     */
    get: (hash: string): AIToolOutput | null => {
        cleanExpired();

        const entry = cache.get(hash);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > CACHE_TTL_MS) {
            cache.delete(hash);
            return null;
        }

        return entry.output;
    },

    /**
     * Set cached output
     */
    set: (hash: string, output: AIToolOutput): void => {
        cache.set(hash, {
            output,
            timestamp: Date.now()
        });

        enforceMaxSize();
    },

    /**
     * Clear entire cache
     */
    clear: (): void => {
        cache.clear();
    },

    /**
     * Get cache stats
     */
    stats: (): { size: number; ttlMs: number } => ({
        size: cache.size,
        ttlMs: CACHE_TTL_MS
    })
};
