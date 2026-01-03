/**
 * AI Tool: Generate Items
 * Creates new items from a prompt (tasks, subtasks, checklist, brief, meeting notes)
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const generateItemsTool: AITool = {
    name: 'generate_items',
    description: 'Generate new items from a prompt like tasks, subtasks, checklist, brief, or meeting notes',
    inputSchema: TOOL_SCHEMAS.generate_items.input,
    outputSchema: TOOL_SCHEMAS.generate_items.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { prompt, itemType, count = 5, context: additionalContext } = input;

            if (!prompt || prompt.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No prompt provided.',
                    error: 'EMPTY_PROMPT'
                };
            }

            const typeInstructions: Record<string, string> = {
                tasks: `Generate ${count} actionable tasks. Each task should have: title, category (PRODUCT/CONTENT/MONEY/ADMIN/MEETING), priority (HIGH/MEDIUM/LOW), and estimatedMinutes.`,
                subtasks: `Generate ${count} subtasks that break down the main task. Each subtask should have: title and estimatedMinutes.`,
                checklist: `Generate a checklist of ${count} items. Each item should have: text and order.`,
                brief: `Generate a project brief with: overview, objectives (array), deliverables (array), timeline, and budget.`,
                meeting_notes: `Generate meeting notes with: summary, attendees (array), discussionPoints (array), actionItems (array with owner and dueDate), and nextMeeting.`
            };

            const instruction = typeInstructions[itemType] || typeInstructions.tasks;

            let contextPrompt = '';
            if (additionalContext) {
                contextPrompt = `\nCONTEXT: ${additionalContext}`;
            }

            const aiPrompt = `${instruction}
${contextPrompt}

USER REQUEST:
${prompt}

Return ONLY valid JSON with:
- items: array of generated items matching the structure above
- generatedText: human-readable version of the generated content
- assumptions: array of strings explaining any assumptions made

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(aiPrompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: false,
                    humanReadable: 'Could not generate items.',
                    error: 'PARSE_ERROR'
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Build human-readable preview
            let humanReadable = `### Generated ${itemType}\n`;

            if (parsed.generatedText) {
                humanReadable += parsed.generatedText;
            } else if (parsed.items?.length > 0) {
                if (itemType === 'tasks' || itemType === 'subtasks') {
                    parsed.items.forEach((item: any, i: number) => {
                        humanReadable += `${i + 1}. **${item.title}**`;
                        if (item.priority) humanReadable += ` [${item.priority}]`;
                        if (item.estimatedMinutes) humanReadable += ` (~${item.estimatedMinutes}min)`;
                        humanReadable += '\n';
                    });
                } else if (itemType === 'checklist') {
                    parsed.items.forEach((item: any) => {
                        humanReadable += `- [ ] ${item.text}\n`;
                    });
                } else if (itemType === 'brief') {
                    const brief = parsed.items[0] || parsed;
                    humanReadable += `**Overview:** ${brief.overview || 'N/A'}\n`;
                    if (brief.objectives) humanReadable += `**Objectives:** ${brief.objectives.join(', ')}\n`;
                    if (brief.deliverables) humanReadable += `**Deliverables:** ${brief.deliverables.join(', ')}\n`;
                } else {
                    humanReadable += JSON.stringify(parsed.items, null, 2);
                }
            }

            return {
                success: true,
                data: {
                    items: parsed.items || [],
                    generatedText: parsed.generatedText
                },
                humanReadable,
                confidence: 0.85,
                assumptions: parsed.assumptions
            };

        } catch (error) {
            console.error('[AI Generate] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to generate items. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
