/**
 * AI Logger
 * Logs AI runs for debugging and observability (without PII)
 */

import { AIRun } from './types';

const MAX_LOG_ENTRIES = 500;
const logs: AIRun[] = [];

/**
 * Sanitize input/output to remove potential PII
 */
const sanitize = (data: any): any => {
    if (!data) return data;

    // Convert to string and remove potential PII patterns
    const str = JSON.stringify(data);

    // Remove email addresses
    const sanitized = str
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
        // Remove phone numbers
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
        // Truncate long strings
        .substring(0, 1000);

    try {
        return JSON.parse(sanitized);
    } catch {
        return { truncated: sanitized };
    }
};

export const aiLogger = {
    /**
     * Log an AI run
     */
    log: (run: AIRun): void => {
        const sanitizedRun: AIRun = {
            ...run,
            input: sanitize(run.input),
            output: {
                ...run.output,
                data: sanitize(run.output.data)
            }
        };

        logs.unshift(sanitizedRun);

        // Enforce max size
        if (logs.length > MAX_LOG_ENTRIES) {
            logs.length = MAX_LOG_ENTRIES;
        }

        // Also log to console in development
        if (import.meta.env.DEV) {
            console.log(`[AI Run] ${run.toolName}`, {
                requestId: run.id,
                status: run.status,
                durationMs: run.durationMs,
                confidence: run.output.confidence
            });
        }
    },

    /**
     * Get recent logs
     */
    getRecent: (count: number = 20): AIRun[] => {
        return logs.slice(0, count);
    },

    /**
     * Get logs by user
     */
    getByUser: (userId: string, count: number = 20): AIRun[] => {
        return logs.filter(l => l.userId === userId).slice(0, count);
    },

    /**
     * Get logs by tool
     */
    getByTool: (toolName: string, count: number = 20): AIRun[] => {
        return logs.filter(l => l.toolName === toolName).slice(0, count);
    },

    /**
     * Get error logs
     */
    getErrors: (count: number = 20): AIRun[] => {
        return logs.filter(l => l.status === 'error').slice(0, count);
    },

    /**
     * Get stats
     */
    getStats: (): {
        totalRuns: number;
        successRate: number;
        avgDurationMs: number;
        toolUsage: Record<string, number>;
    } => {
        const successCount = logs.filter(l => l.status === 'success').length;
        const totalDuration = logs.reduce((sum, l) => sum + (l.durationMs || 0), 0);

        const toolUsage: Record<string, number> = {};
        logs.forEach(l => {
            toolUsage[l.toolName] = (toolUsage[l.toolName] || 0) + 1;
        });

        return {
            totalRuns: logs.length,
            successRate: logs.length > 0 ? successCount / logs.length : 0,
            avgDurationMs: logs.length > 0 ? totalDuration / logs.length : 0,
            toolUsage
        };
    },

    /**
     * Clear logs
     */
    clear: (): void => {
        logs.length = 0;
    }
};
