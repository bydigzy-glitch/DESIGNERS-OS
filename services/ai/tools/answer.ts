/**
 * AI Tool: Answer Question
 * Q&A over current workspace data within user permissions
 */

import { AITool, AIToolInput, AIToolOutput, AIContext, TOOL_SCHEMAS } from '../types';
import { sendMessageToGemini } from '../../geminiService';

export const answerQuestionTool: AITool = {
    name: 'answer_question',
    description: 'Answer questions over current workspace data within user permissions',
    inputSchema: TOOL_SCHEMAS.answer_question.input,
    outputSchema: TOOL_SCHEMAS.answer_question.output,

    execute: async (input: AIToolInput, context: AIContext): Promise<AIToolOutput> => {
        try {
            const { question, dataContext } = input;

            if (!question || question.trim().length === 0) {
                return {
                    success: false,
                    humanReadable: 'No question provided.',
                    error: 'EMPTY_QUESTION'
                };
            }

            // Check permissions
            if (!context.permissions.canRead) {
                return {
                    success: false,
                    humanReadable: 'You do not have permission to access this data.',
                    error: 'PERMISSION_DENIED'
                };
            }

            // Build context from workspace data
            let contextString = '';
            if (dataContext) {
                if (dataContext.tasks?.length > 0) {
                    contextString += `\nTASKS (${dataContext.tasks.length} total):\n`;
                    dataContext.tasks.slice(0, 20).forEach((t: any) => {
                        contextString += `- ${t.title} [${t.completed ? 'DONE' : 'PENDING'}] ${t.priority || ''}\n`;
                    });
                }
                if (dataContext.projects?.length > 0) {
                    contextString += `\nPROJECTS (${dataContext.projects.length} total):\n`;
                    dataContext.projects.slice(0, 10).forEach((p: any) => {
                        contextString += `- ${p.title} [${p.status}] $${p.price || 0}\n`;
                    });
                }
                if (dataContext.clients?.length > 0) {
                    contextString += `\nCLIENTS (${dataContext.clients.length} total):\n`;
                    dataContext.clients.slice(0, 10).forEach((c: any) => {
                        contextString += `- ${c.name} [${c.status}]\n`;
                    });
                }
            }

            const prompt = `You are answering a question about the user's workspace data.

WORKSPACE DATA:
${contextString || 'No specific data provided.'}

USER QUESTION:
${question}

Answer the question based ONLY on the provided data. If you cannot answer from the data, say so.

Return ONLY valid JSON with:
- answer: string (the answer to the question)
- sources: array of strings (which data items were used)
- confidence: number 0-1 (how confident you are in the answer)
- cannotAnswer: boolean (true if you cannot answer from the data)

Return ONLY valid JSON, no markdown code blocks.`;

            const response = await sendMessageToGemini(prompt);

            // Parse JSON from response
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    success: true,
                    data: { answer: response.text, sources: [], confidence: 0.5 },
                    humanReadable: response.text,
                    confidence: 0.5,
                    assumptions: ['Could not parse structured response']
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.cannotAnswer) {
                return {
                    success: true,
                    data: parsed,
                    humanReadable: `I couldn't find an answer to that question in your workspace data.\n\n_${parsed.answer}_`,
                    confidence: 0.3
                };
            }

            let humanReadable = `### Answer\n${parsed.answer}`;

            if (parsed.sources?.length > 0) {
                humanReadable += `\n\n_Based on: ${parsed.sources.join(', ')}_`;
            }

            return {
                success: true,
                data: parsed,
                humanReadable,
                confidence: parsed.confidence || 0.75
            };

        } catch (error) {
            console.error('[AI Answer] Error:', error);
            return {
                success: false,
                humanReadable: 'Failed to answer question. Please try again.',
                error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
            };
        }
    }
};
