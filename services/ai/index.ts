/**
 * AI Service - Main Exports
 * Central export point for the AI system
 */

// Types
export * from './types';

// Tools
export { toolRegistry, TOOL_METADATA } from './tools';
export type { AITool } from './types';

// Orchestrator
export { executeAIRequest, aiActions } from './orchestrator';

// Utilities
export { aiCache } from './cache';
export { aiLogger } from './logger';

// Re-export individual tools for direct access
export {
    summarizeTool,
    rewriteTool,
    extractFieldsTool,
    classifyTagsTool,
    generateItemsTool,
    answerQuestionTool
} from './tools';
