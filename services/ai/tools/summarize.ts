/**
 * AI Tool: Summarize
 * Summarizes content into bullet points, key decisions, and next actions
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const summarizeTool: AITool = {
    name: 'summarize',
    description: 'Summarize a record, list, or conversation with bullet points, key decisions, and next actions',
    inputSchema: TOOL_SCHEMAS.summarize.input,
    outputSchema: TOOL_SCHEMAS.summarize.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { content, format = 'bullets', maxLength } = input;

            if (!content || content.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No content provided to summarize.',
                    error: 'EMPTY_CONTENT'
                };
            }

            const prompt = `Summarize the following content. Return a JSON object with these fields:
- summary: A ${format === 'paragraph' ? 'paragraph' : 'bullet point list'} summary${maxLength ? ` (max ${maxLength} words)` : ''}
- keyPoints: Array of 3-5 key points
- nextActions: Array of suggested next actions (if applicable)
- decisions: Array of key decisions mentioned (if any)

CONTENT:
${content}

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(prompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: true,
                    data: { summary: response.text, keyPoints: [], nextActions: [], decisions: [] },
                    humanReadable: response.text,
                    confidence: 0.7,
                    assumptions: ['Could not parse structured response, returning raw summary']
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Build human-readable output
            let humanReadable = `### Summary\n${parsed.summary}\n`;

            if (parsed.keyPoints?.length > 0) {
                humanReadable += `\n### Key Points\n${parsed.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n`;
            }

            if (parsed.nextActions?.length > 0) {
                humanReadable += `\n### Next Actions\n${parsed.nextActions.map((a: string) => `- ${a}`).join('\n')}\n`;
            }

            if (parsed.decisions?.length > 0) {
                humanReadable += `\n### Decisions\n${parsed.decisions.map((d: string) => `- ${d}`).join('\n')}\n`;
            }

            return {
                success: true,
                data: parsed,
                humanReadable,
                confidence: 0.85
            };

        } catch (error) {
            console.error('[AI Summarize] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to generate summary. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
