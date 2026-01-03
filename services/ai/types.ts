/**
 * AI System Types
 * Core type definitions for the AI tool registry and orchestrator
 */

// ============================================
// TOOL DEFINITIONS
// ============================================

export interface AIToolInput {
    [key: string]: any;
}

export interface AIToolOutput {
    success: boolean;
    data?: any;
    humanReadable: string;
    confidence?: number;
    assumptions?: string[];
    error?: string;
}

export interface AITool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
    execute: (input: AIToolInput, context: AIContext) => Promise<AIToolOutput>;
}

// ============================================
// CONTEXT & STATE
// ============================================

export interface AIContext {
    userId: string;
    workspaceId?: string;
    targetType?: 'task' | 'project' | 'client' | 'habit' | 'file' | 'text';
    targetId?: string;
    targetData?: any;
    permissions: AIPermissions;
}

export interface AIPermissions {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

// ============================================
// RUN TRACKING
// ============================================

export interface AIRun {
    id: string;
    userId: string;
    workspaceId?: string;
    toolName: string;
    inputHash: string;
    input: Record<string, any>;
    output: AIToolOutput;
    status: 'pending' | 'success' | 'error' | 'cancelled';
    createdAt: Date;
    completedAt?: Date;
    durationMs?: number;
}

// ============================================
// REQUEST/RESPONSE
// ============================================

export interface AIRequest {
    requestId: string;
    toolName?: string; // If null, orchestrator selects
    input: Record<string, any>;
    context: AIContext;
    userPrompt?: string; // Natural language for orchestrator
}

export interface AIResponse {
    requestId: string;
    toolName: string;
    output: AIToolOutput;
    preview?: AIPreview;
    run: AIRun;
}

export interface AIPreview {
    type: 'create' | 'update' | 'delete' | 'info';
    title: string;
    description: string;
    diff?: AIDiff;
    items?: AIPreviewItem[];
}

export interface AIDiff {
    before: string;
    after: string;
}

export interface AIPreviewItem {
    label: string;
    value: string;
    type?: 'text' | 'tag' | 'date' | 'number';
}

// ============================================
// TOOL REGISTRY
// ============================================

export type AIToolName =
    | 'summarize'
    | 'rewrite'
    | 'extract_fields'
    | 'classify_tags'
    | 'generate_items'
    | 'answer_question';

export interface AIToolRegistry {
    tools: Map<AIToolName, AITool>;
    register: (tool: AITool) => void;
    get: (name: AIToolName) => AITool | undefined;
    list: () => AITool[];
}

// ============================================
// SCHEMAS FOR EACH TOOL
// ============================================

export const TOOL_SCHEMAS = {
    summarize: {
        input: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Text or data to summarize' },
                format: { type: 'string', enum: ['bullets', 'paragraph', 'key_points'], default: 'bullets' },
                maxLength: { type: 'number', description: 'Max words in summary' }
            },
            required: ['content']
        },
        output: {
            type: 'object',
            properties: {
                summary: { type: 'string' },
                keyPoints: { type: 'array', items: { type: 'string' } },
                nextActions: { type: 'array', items: { type: 'string' } },
                decisions: { type: 'array', items: { type: 'string' } }
            }
        }
    },

    rewrite: {
        input: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to rewrite' },
                tone: { type: 'string', enum: ['professional', 'casual', 'formal', 'friendly', 'concise'], default: 'professional' },
                instruction: { type: 'string', description: 'Specific rewrite instructions' }
            },
            required: ['text']
        },
        output: {
            type: 'object',
            properties: {
                rewritten: { type: 'string' },
                diff: { type: 'object', properties: { before: { type: 'string' }, after: { type: 'string' } } }
            }
        }
    },

    extract_fields: {
        input: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Free text to extract from' },
                targetType: { type: 'string', enum: ['task', 'project', 'client', 'event'] }
            },
            required: ['text', 'targetType']
        },
        output: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                dueDate: { type: 'string' },
                priority: { type: 'string' },
                extractedFields: { type: 'object' }
            }
        }
    },

    classify_tags: {
        input: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Content to classify' },
                existingTags: { type: 'array', items: { type: 'string' }, description: 'Existing taxonomy' },
                maxTags: { type: 'number', default: 5 }
            },
            required: ['content']
        },
        output: {
            type: 'object',
            properties: {
                suggestedTags: { type: 'array', items: { type: 'object', properties: { tag: { type: 'string' }, confidence: { type: 'number' } } } },
                newTags: { type: 'array', items: { type: 'string' } }
            }
        }
    },

    generate_items: {
        input: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'What to generate' },
                itemType: { type: 'string', enum: ['tasks', 'subtasks', 'checklist', 'brief', 'meeting_notes'] },
                count: { type: 'number', default: 5 },
                context: { type: 'string', description: 'Additional context' }
            },
            required: ['prompt', 'itemType']
        },
        output: {
            type: 'object',
            properties: {
                items: { type: 'array', items: { type: 'object' } },
                generatedText: { type: 'string' }
            }
        }
    },

    answer_question: {
        input: {
            type: 'object',
            properties: {
                question: { type: 'string', description: 'Question to answer' },
                dataContext: { type: 'object', description: 'Relevant workspace data' }
            },
            required: ['question']
        },
        output: {
            type: 'object',
            properties: {
                answer: { type: 'string' },
                sources: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number' }
            }
        }
    }
} as const;
