/**
 * AI Tool: Extract Fields
 * Extracts structured fields from free text (title, description, tags, due date, priority)
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const extractFieldsTool: AITool = {
    name: 'extract_fields',
    description: 'Extract structured fields from free text like title, description, tags, due date, priority',
    inputSchema: TOOL_SCHEMAS.extract_fields.input,
    outputSchema: TOOL_SCHEMAS.extract_fields.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { text, targetType } = input;

            if (!text || text.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No text provided to extract from.',
                    error: 'EMPTY_TEXT'
                };
            }

            const fieldsByType: Record<string, string[]> = {
                task: ['title', 'description', 'dueDate', 'priority', 'category', 'tags'],
                project: ['title', 'client', 'deadline', 'price', 'status', 'tags'],
                client: ['name', 'email', 'notes', 'source', 'budget'],
                event: ['title', 'date', 'time', 'duration', 'location', 'attendees']
            };

            const fields = fieldsByType[targetType] || fieldsByType.task;

            const prompt = `Extract structured fields from this text for a ${targetType}.

TEXT:
${text}

Extract these fields if present: ${fields.join(', ')}

Return ONLY valid JSON with these fields:
- title: string (required)
- description: string (optional)
- tags: array of strings (optional)
- dueDate: ISO date string if mentioned (optional)
- priority: "HIGH", "MEDIUM", or "LOW" if implied (optional)
- extractedFields: object with any other extracted fields
- confidence: number 0-1 indicating extraction confidence
- assumptions: array of strings explaining any guesses made

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(prompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: false,
                    humanReadable: 'Could not extract structured fields from the text.',
                    error: 'PARSE_ERROR'
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Build human-readable preview
            let humanReadable = `### Extracted Fields\n`;
            humanReadable += `**Title:** ${parsed.title || 'Not found'}\n`;

            if (parsed.description) {
                humanReadable += `**Description:** ${parsed.description}\n`;
            }
            if (parsed.dueDate) {
                humanReadable += `**Due Date:** ${parsed.dueDate}\n`;
            }
            if (parsed.priority) {
                humanReadable += `**Priority:** ${parsed.priority}\n`;
            }
            if (parsed.tags?.length > 0) {
                humanReadable += `**Tags:** ${parsed.tags.join(', ')}\n`;
            }
            if (parsed.extractedFields) {
                Object.entries(parsed.extractedFields).forEach(([key, value]) => {
                    humanReadable += `**${key}:** ${value}\n`;
                });
            }

            return {
                success: true,
                data: parsed,
                humanReadable,
                confidence: parsed.confidence || 0.8,
                assumptions: parsed.assumptions
            };

        } catch (error) {
            console.error('[AI Extract] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to extract fields. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
