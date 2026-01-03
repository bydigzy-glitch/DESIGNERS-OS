/**
 * useAI Hook
 * React hook for using AI capabilities in components
 */

import { useState, useCallback, useMemo } from 'react';
import { AIContext, AIResponse, AIToolName, AIToolOutput } from '../services/ai/types';
import { executeAIRequest, aiActions } from '../services/ai';

interface UseAIOptions {
    userId: string;
    workspaceId?: string;
    canRead?: boolean;
    canWrite?: boolean;
    canDelete?: boolean;
}

interface UseAIReturn {
    // State
    isLoading: boolean;
    error: string | null;
    lastResponse: AIResponse | null;

    // Actions
    summarize: (content: string) => Promise<AIResponse>;
    rewrite: (text: string, tone?: string) => Promise<AIResponse>;
    extract: (text: string, targetType?: string) => Promise<AIResponse>;
    classify: (content: string, existingTags?: string[]) => Promise<AIResponse>;
    generate: (prompt: string, itemType?: string) => Promise<AIResponse>;
    ask: (question: string, dataContext?: any) => Promise<AIResponse>;

    // Generic execute
    execute: (toolName: AIToolName, input: Record<string, any>) => Promise<AIResponse>;

    // Utilities
    clearError: () => void;
    clearResponse: () => void;
}

export const useAI = (options: UseAIOptions): UseAIReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

    const context: AIContext = useMemo(() => ({
        userId: options.userId,
        workspaceId: options.workspaceId,
        permissions: {
            canRead: options.canRead ?? true,
            canWrite: options.canWrite ?? true,
            canDelete: options.canDelete ?? false,
        },
    }), [options.userId, options.workspaceId, options.canRead, options.canWrite, options.canDelete]);

    const handleRequest = useCallback(async (
        requestFn: () => Promise<AIResponse>
    ): Promise<AIResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await requestFn();
            setLastResponse(response);

            if (!response.output.success) {
                setError(response.output.error || 'Unknown error');
            }

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'AI request failed';
            setError(errorMessage);

            const errorResponse: AIResponse = {
                requestId: `error_${Date.now()}`,
                toolName: 'unknown',
                output: {
                    success: false,
                    humanReadable: errorMessage,
                    error: errorMessage,
                },
                run: {
                    id: `error_${Date.now()}`,
                    userId: context.userId,
                    toolName: 'unknown',
                    inputHash: '',
                    input: {},
                    output: { success: false, humanReadable: errorMessage, error: errorMessage },
                    status: 'error',
                    createdAt: new Date(),
                },
            };

            setLastResponse(errorResponse);
            return errorResponse;
        } finally {
            setIsLoading(false);
        }
    }, [context.userId]);

    const summarize = useCallback(
        (content: string) => handleRequest(() => aiActions.summarize(content, context)),
        [handleRequest, context]
    );

    const rewrite = useCallback(
        (text: string, tone: string = 'professional') =>
            handleRequest(() => aiActions.rewrite(text, tone, context)),
        [handleRequest, context]
    );

    const extract = useCallback(
        (text: string, targetType: string = 'task') =>
            handleRequest(() => aiActions.extract(text, targetType, context)),
        [handleRequest, context]
    );

    const classify = useCallback(
        (content: string, existingTags: string[] = []) =>
            handleRequest(() => aiActions.classify(content, existingTags, context)),
        [handleRequest, context]
    );

    const generate = useCallback(
        (prompt: string, itemType: string = 'tasks') =>
            handleRequest(() => aiActions.generate(prompt, itemType, context)),
        [handleRequest, context]
    );

    const ask = useCallback(
        (question: string, dataContext?: any) =>
            handleRequest(() => aiActions.ask(question, dataContext, context)),
        [handleRequest, context]
    );

    const execute = useCallback(
        (toolName: AIToolName, input: Record<string, any>) =>
            handleRequest(() => executeAIRequest({
                requestId: `exec_${Date.now()}`,
                toolName,
                input,
                context,
            })),
        [handleRequest, context]
    );

    const clearError = useCallback(() => setError(null), []);
    const clearResponse = useCallback(() => setLastResponse(null), []);

    return {
        isLoading,
        error,
        lastResponse,
        summarize,
        rewrite,
        extract,
        classify,
        generate,
        ask,
        execute,
        clearError,
        clearResponse,
    };
};
