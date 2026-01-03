/**
 * AI Tool Registry
 * Central registry for all AI tools with registration and lookup
 */

import { AITool, AIToolName, AIToolRegistry } from '../types';
import { summarizeTool } from './summarize';
import { rewriteTool } from './rewrite';
import { extractFieldsTool } from './extract';
import { classifyTagsTool } from './classify';
import { generateItemsTool } from './generate';
import { answerQuestionTool } from './answer';

// Create the registry
const tools = new Map<AIToolName, AITool>();

// Register all tools
const registerTool = (tool: AITool) => {
    tools.set(tool.name as AIToolName, tool);
};

// Initialize with all tools
registerTool(summarizeTool);
registerTool(rewriteTool);
registerTool(extractFieldsTool);
registerTool(classifyTagsTool);
registerTool(generateItemsTool);
registerTool(answerQuestionTool);

export const toolRegistry: AIToolRegistry = {
    tools,
    register: registerTool,
    get: (name: AIToolName) => tools.get(name),
    list: () => Array.from(tools.values())
};

// Named exports for direct access
export {
    summarizeTool,
    rewriteTool,
    extractFieldsTool,
    classifyTagsTool,
    generateItemsTool,
    answerQuestionTool
};

// Tool metadata for UI display
export const TOOL_METADATA: Record<AIToolName, { label: string; description: string; icon: string }> = {
    summarize: {
        label: 'Summarize',
        description: 'Get key points, decisions, and next actions',
        icon: 'FileText'
    },
    rewrite: {
        label: 'Rewrite',
        description: 'Rewrite text in a different tone',
        icon: 'Pencil'
    },
    extract_fields: {
        label: 'Extract',
        description: 'Extract structured data from text',
        icon: 'Filter'
    },
    classify_tags: {
        label: 'Classify',
        description: 'Suggest tags and categories',
        icon: 'Tags'
    },
    generate_items: {
        label: 'Generate',
        description: 'Create tasks, checklists, briefs',
        icon: 'Sparkles'
    },
    answer_question: {
        label: 'Ask',
        description: 'Answer questions about your data',
        icon: 'MessageCircle'
    }
};
