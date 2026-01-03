/**
 * AI Orchestrator
 * Selects the right tool based on user intent, validates input/output, and manages execution
 */

import {
    AIRequest,
    AIResponse,
    AIContext,
    AIRun,
    AIToolName,
    AIPreview,
    AIToolOutput
} from './types';
import { toolRegistry, TOOL_METADATA } from './tools';
import { sendMessageToGemini } from '../geminiService';
import { aiCache } from './cache';
import { aiLogger } from './logger';

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestTimestamps: Map<string, number[]> = new Map();

/**
 * Check if request is rate limited
 */
const isRateLimited = (userId: string): boolean => {
    const now = Date.now();
    const timestamps = requestTimestamps.get(userId) || [];

    // Filter to only recent timestamps
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    requestTimestamps.set(userId, recentTimestamps);

    return recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS;
};

/**
 * Record a request for rate limiting
 */
const recordRequest = (userId: string): void => {
    const timestamps = requestTimestamps.get(userId) || [];
    timestamps.push(Date.now());
    requestTimestamps.set(userId, timestamps);
};

/**
 * Generate a unique request ID
 */
const generateRequestId = (): string => {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a hash for caching
 */
const hashInput = (toolName: string, input: Record<string, any>): string => {
    const str = JSON.stringify({ toolName, input });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

/**
 * Content moderation check
 */
const moderateContent = async (content: string): Promise<{ safe: boolean; reason?: string }> => {
    // Basic keyword check for unsafe content
    const unsafePatterns = [
        /\b(password|secret|api[_-]?key|token)\s*[:=]/i,
        /\b(ssn|social\s*security)\b/i,
        /\b(credit\s*card|cvv)\b/i
    ];

    for (const pattern of unsafePatterns) {
        if (pattern.test(content)) {
            return {
                safe: false,
                reason: 'Content may contain sensitive information. Please remove personal/secret data before processing.'
            };
        }
    }

    return { safe: true };
};

/**
 * Select the appropriate tool based on user prompt
 */
const selectTool = async (userPrompt: string): Promise<AIToolName | null> => {
    const toolDescriptions = toolRegistry.list().map(t =>
        `- ${t.name}: ${t.description}`
    ).join('\n');

    const prompt = `Based on the user's request, select the most appropriate AI tool.

AVAILABLE TOOLS:
${toolDescriptions}

USER REQUEST:
${userPrompt}

Respond with ONLY the tool name (one of: summarize, rewrite, extract_fields, classify_tags, generate_items, answer_question).
If no tool matches, respond with "none".`;

    try {
        const response = await sendMessageToGemini(prompt);
        const toolName = response.text.trim().toLowerCase().replace(/[^a-z_]/g, '') as AIToolName;

        if (toolRegistry.get(toolName)) {
            return toolName;
        }
        return null;
    } catch {
        return null;
    }
};

/**
 * Build preview for UI confirmation
 */
const buildPreview = (toolName: string, output: AIToolOutput): AIPreview | undefined => {
    if (!output.success || !output.data) return undefined;

    const data = output.data;

    switch (toolName) {
        case 'rewrite':
            return {
                type: 'update',
                title: 'Rewrite Text',
                description: 'The following changes will be applied:',
                diff: data.diff
            };

        case 'generate_items':
            return {
                type: 'create',
                title: `Create ${data.items?.length || 0} Items`,
                description: 'The following items will be created:',
                items: data.items?.map((item: any) => ({
                    label: item.title || item.text || 'Item',
                    value: item.description || item.priority || '',
                    type: 'text'
                }))
            };

        case 'extract_fields':
            return {
                type: 'create',
                title: 'Create from Extracted Fields',
                description: 'The following fields were extracted:',
                items: Object.entries(data).filter(([k]) => k !== 'extractedFields').map(([key, value]) => ({
                    label: key,
                    value: Array.isArray(value) ? value.join(', ') : String(value),
                    type: key === 'dueDate' ? 'date' : 'text'
                }))
            };

        default:
            return {
                type: 'info',
                title: TOOL_METADATA[toolName as AIToolName]?.label || 'AI Result',
                description: output.humanReadable
            };
    }
};

/**
 * Main orchestrator function
 */
export const executeAIRequest = async (request: AIRequest): Promise<AIResponse> => {
    const startTime = Date.now();
    const requestId = request.requestId || generateRequestId();

    // Rate limiting check
    if (isRateLimited(request.context.userId)) {
        const errorOutput: AIToolOutput = {
            success: false,
            humanReadable: 'Rate limit exceeded. Please wait a moment before making more AI requests.',
            error: 'RATE_LIMITED'
        };

        return {
            requestId,
            toolName: request.toolName || 'unknown',
            output: errorOutput,
            run: {
                id: requestId,
                userId: request.context.userId,
                workspaceId: request.context.workspaceId,
                toolName: request.toolName || 'unknown',
                inputHash: '',
                input: request.input,
                output: errorOutput,
                status: 'error',
                createdAt: new Date()
            }
        };
    }

    recordRequest(request.context.userId);

    // Determine tool
    let toolName = request.toolName as AIToolName;
    if (!toolName && request.userPrompt) {
        const selectedTool = await selectTool(request.userPrompt);
        if (!selectedTool) {
            const errorOutput: AIToolOutput = {
                success: false,
                humanReadable: 'Could not determine the appropriate AI action. Please be more specific.',
                error: 'NO_TOOL_MATCH'
            };

            return {
                requestId,
                toolName: 'unknown',
                output: errorOutput,
                run: {
                    id: requestId,
                    userId: request.context.userId,
                    workspaceId: request.context.workspaceId,
                    toolName: 'unknown',
                    inputHash: '',
                    input: request.input,
                    output: errorOutput,
                    status: 'error',
                    createdAt: new Date()
                }
            };
        }
        toolName = selectedTool;
    }

    const tool = toolRegistry.get(toolName);
    if (!tool) {
        const errorOutput: AIToolOutput = {
            success: false,
            humanReadable: `Unknown AI tool: ${toolName}`,
            error: 'UNKNOWN_TOOL'
        };

        return {
            requestId,
            toolName,
            output: errorOutput,
            run: {
                id: requestId,
                userId: request.context.userId,
                workspaceId: request.context.workspaceId,
                toolName,
                inputHash: '',
                input: request.input,
                output: errorOutput,
                status: 'error',
                createdAt: new Date()
            }
        };
    }

    // Check cache
    const inputHash = hashInput(toolName, request.input);
    const cached = aiCache.get(inputHash);
    if (cached) {
        return {
            requestId,
            toolName,
            output: cached,
            preview: buildPreview(toolName, cached),
            run: {
                id: requestId,
                userId: request.context.userId,
                workspaceId: request.context.workspaceId,
                toolName,
                inputHash,
                input: request.input,
                output: cached,
                status: 'success',
                createdAt: new Date(),
                completedAt: new Date(),
                durationMs: 0
            }
        };
    }

    // Content moderation
    const contentToCheck = JSON.stringify(request.input);
    const moderationResult = await moderateContent(contentToCheck);
    if (!moderationResult.safe) {
        const errorOutput: AIToolOutput = {
            success: false,
            humanReadable: moderationResult.reason || 'Content flagged for safety.',
            error: 'CONTENT_UNSAFE'
        };

        return {
            requestId,
            toolName,
            output: errorOutput,
            run: {
                id: requestId,
                userId: request.context.userId,
                workspaceId: request.context.workspaceId,
                toolName,
                inputHash,
                input: request.input,
                output: errorOutput,
                status: 'error',
                createdAt: new Date()
            }
        };
    }

    // Execute tool
    let output: AIToolOutput;
    try {
        output = await tool.execute(request.input, request.context);
    } catch (error) {
        output = {
            success: false,
            humanReadable: 'AI service temporarily unavailable. Please try again.',
            error: error instanceof Error ? error.message : 'EXECUTION_ERROR'
        };
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    // Cache successful results
    if (output.success) {
        aiCache.set(inputHash, output);
    }

    // Log the run
    const run: AIRun = {
        id: requestId,
        userId: request.context.userId,
        workspaceId: request.context.workspaceId,
        toolName,
        inputHash,
        input: request.input,
        output,
        status: output.success ? 'success' : 'error',
        createdAt: new Date(startTime),
        completedAt: new Date(endTime),
        durationMs
    };

    aiLogger.log(run);

    return {
        requestId,
        toolName,
        output,
        preview: buildPreview(toolName, output),
        run
    };
};

/**
 * Quick access methods for common operations
 */
export const aiActions = {
    summarize: (content: string, context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'summarize',
            input: { content },
            context
        }),

    rewrite: (text: string, tone: string, context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'rewrite',
            input: { text, tone },
            context
        }),

    extract: (text: string, targetType: string, context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'extract_fields',
            input: { text, targetType },
            context
        }),

    classify: (content: string, existingTags: string[], context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'classify_tags',
            input: { content, existingTags },
            context
        }),

    generate: (prompt: string, itemType: string, context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'generate_items',
            input: { prompt, itemType },
            context
        }),

    ask: (question: string, dataContext: any, context: AIContext) =>
        executeAIRequest({
            requestId: generateRequestId(),
            toolName: 'answer_question',
            input: { question, dataContext },
            context
        })
};
