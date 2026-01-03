/**
 * AI Tool: Classify Tags
 * Suggests tags/categories based on existing taxonomy
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const classifyTagsTool: AITool = {
    name: 'classify_tags',
    description: 'Suggest tags and categories based on existing taxonomy',
    inputSchema: TOOL_SCHEMAS.classify_tags.input,
    outputSchema: TOOL_SCHEMAS.classify_tags.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { content, existingTags = [], maxTags = 5 } = input;

            if (!content || content.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No content provided to classify.',
                    error: 'EMPTY_CONTENT'
                };
            }

            const taxonomyPrompt = existingTags.length > 0
                ? `\nEXISTING TAXONOMY (prefer these if applicable): ${existingTags.join(', ')}`
                : '';

            const prompt = `Analyze this content and suggest relevant tags/categories.
${taxonomyPrompt}

CONTENT:
${content}

Return ONLY valid JSON with:
- suggestedTags: array of objects with { tag: string, confidence: number (0-1) }
- newTags: array of new tags not in existing taxonomy (if needed)
- reasoning: brief explanation

Suggest up to ${maxTags} tags total. Prioritize existing taxonomy tags.

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(prompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: false,
                    humanReadable: 'Could not classify content.',
                    error: 'PARSE_ERROR'
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Build human-readable preview
            let humanReadable = `### Suggested Tags\n`;

            if (parsed.suggestedTags?.length > 0) {
                parsed.suggestedTags.forEach((t: { tag: string; confidence: number }) => {
                    const confidencePercent = Math.round(t.confidence * 100);
                    humanReadable += `- **${t.tag}** (${confidencePercent}% match)\n`;
                });
            }

            if (parsed.newTags?.length > 0) {
                humanReadable += `\n### New Tags (not in taxonomy)\n`;
                parsed.newTags.forEach((tag: string) => {
                    humanReadable += `- ${tag}\n`;
                });
            }

            if (parsed.reasoning) {
                humanReadable += `\n_${parsed.reasoning}_`;
            }

            return {
                success: true,
                data: {
                    suggestedTags: parsed.suggestedTags || [],
                    newTags: parsed.newTags || []
                },
                humanReadable,
                confidence: parsed.suggestedTags?.[0]?.confidence || 0.7
            };

        } catch (error) {
            console.error('[AI Classify] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to classify content. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
