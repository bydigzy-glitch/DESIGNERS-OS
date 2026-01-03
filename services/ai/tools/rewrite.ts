/**
 * AI Tool: Rewrite
 * Rewrites selected text in a chosen tone, with diff preview
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const rewriteTool: AITool = {
    name: 'rewrite',
    description: 'Rewrite selected text in the same tone or in a chosen tone',
    inputSchema: TOOL_SCHEMAS.rewrite.input,
    outputSchema: TOOL_SCHEMAS.rewrite.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { text, tone = 'professional', instruction } = input;

            if (!text || text.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No text provided to rewrite.',
                    error: 'EMPTY_TEXT'
                };
            }

            let prompt = `Rewrite the following text in a ${tone} tone.`;

            if (instruction) {
                prompt += ` Additional instruction: ${instruction}`;
            }

            prompt += `

ORIGINAL TEXT:
${text}

Return ONLY valid JSON with these fields:
- rewritten: The rewritten text
- explanation: Brief explanation of changes made (1 sentence)

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(prompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Fallback: treat entire response as rewritten text
                return {
                    success: true,
                    data: {
                        rewritten: response.text,
                        diff: { before: text, after: response.text }
                    },
                    humanReadable: `### Rewritten (${tone})\n${response.text}`,
                    confidence: 0.7,
                    assumptions: ['Could not parse structured response']
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            const humanReadable = `### Rewritten (${tone})\n${parsed.rewritten}\n\n_${parsed.explanation || 'Text rewritten'}_`;

            return {
                success: true,
                data: {
                    rewritten: parsed.rewritten,
                    diff: { before: text, after: parsed.rewritten }
                },
                humanReadable,
                confidence: 0.9
            };

        } catch (error) {
            console.error('[AI Rewrite] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to rewrite text. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
