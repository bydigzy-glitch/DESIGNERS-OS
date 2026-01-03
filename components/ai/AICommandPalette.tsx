/**
 * AI Command Palette
 * Global AI entry point using the existing Command component pattern
 */

import React, { useState, useEffect } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    FileText,
    Pencil,
    Filter,
    Tags,
    Sparkles,
    MessageCircle,
    Loader2,
} from 'lucide-react';
import { AIContext, AIToolName, AIResponse } from '../../services/ai/types';
import { executeAIRequest, TOOL_METADATA } from '../../services/ai';
import { AIPreviewDialog } from './AIPreviewDialog';

interface AICommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    context: AIContext;
    onApplyResult?: (toolName: string, result: any) => void;
    // Workspace data for Q&A
    tasks?: any[];
    projects?: any[];
    clients?: any[];
}

const TOOL_ICONS: Record<AIToolName, React.ReactNode> = {
    summarize: <FileText size={16} />,
    rewrite: <Pencil size={16} />,
    extract_fields: <Filter size={16} />,
    classify_tags: <Tags size={16} />,
    generate_items: <Sparkles size={16} />,
    answer_question: <MessageCircle size={16} />,
};

export const AICommandPalette: React.FC<AICommandPaletteProps> = ({
    open,
    onOpenChange,
    context,
    onApplyResult,
    tasks = [],
    projects = [],
    clients = [],
}) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Reset state when closed
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResponse(null);
            setShowPreview(false);
        }
    }, [open]);

    const handleToolSelect = async (toolName: AIToolName) => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const input = buildInputForTool(toolName, query);
            const result = await executeAIRequest({
                requestId: `cmd_${Date.now()}`,
                toolName,
                input,
                context,
            });

            setResponse(result);
            setShowPreview(true);
            onOpenChange(false);
        } catch (error) {
            console.error('AI Command Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAsk = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const result = await executeAIRequest({
                requestId: `cmd_${Date.now()}`,
                userPrompt: query,
                input: {
                    question: query,
                    dataContext: { tasks, projects, clients }
                },
                context,
            });

            setResponse(result);
            setShowPreview(true);
            onOpenChange(false);
        } catch (error) {
            console.error('AI Command Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const buildInputForTool = (toolName: AIToolName, userQuery: string): any => {
        switch (toolName) {
            case 'summarize':
                return { content: userQuery };
            case 'rewrite':
                return { text: userQuery, tone: 'professional' };
            case 'extract_fields':
                return { text: userQuery, targetType: 'task' };
            case 'classify_tags':
                return { content: userQuery };
            case 'generate_items':
                return { prompt: userQuery, itemType: 'tasks', count: 5 };
            case 'answer_question':
                return { question: userQuery, dataContext: { tasks, projects, clients } };
            default:
                return { content: userQuery };
        }
    };

    const handleApply = (result: any) => {
        if (onApplyResult && response) {
            onApplyResult(response.toolName, result);
        }
        setShowPreview(false);
        setResponse(null);
    };

    return (
        <>
            <CommandDialog open={open} onOpenChange={onOpenChange}>
                <CommandInput
                    placeholder="Ask AI anything..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                        </div>
                    ) : (
                        <>
                            <CommandEmpty>
                                {query.trim() ? (
                                    <button
                                        onClick={handleQuickAsk}
                                        className="w-full text-left px-2 py-3 hover:bg-accent rounded-sm"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-primary" />
                                            <span>Ask AI: "{query}"</span>
                                        </span>
                                    </button>
                                ) : (
                                    'Type a question or select a tool...'
                                )}
                            </CommandEmpty>

                            {query.trim() && (
                                <>
                                    <CommandGroup heading="Quick Actions">
                                        <CommandItem onSelect={handleQuickAsk}>
                                            <Sparkles size={16} className="mr-2 text-primary" />
                                            <span>Ask AI: "{query.slice(0, 40)}{query.length > 40 ? '...' : ''}"</span>
                                        </CommandItem>
                                    </CommandGroup>
                                    <CommandSeparator />
                                </>
                            )}

                            <CommandGroup heading="AI Tools">
                                {(Object.keys(TOOL_METADATA) as AIToolName[]).map((toolName) => {
                                    const meta = TOOL_METADATA[toolName];
                                    return (
                                        <CommandItem
                                            key={toolName}
                                            onSelect={() => handleToolSelect(toolName)}
                                            disabled={!query.trim()}
                                        >
                                            <span className="mr-2 text-muted-foreground">
                                                {TOOL_ICONS[toolName]}
                                            </span>
                                            <div className="flex flex-col">
                                                <span>{meta.label}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {meta.description}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>

            {response && (
                <AIPreviewDialog
                    open={showPreview}
                    onOpenChange={setShowPreview}
                    response={response}
                    onApply={handleApply}
                    onCancel={() => {
                        setShowPreview(false);
                        setResponse(null);
                    }}
                />
            )}
        </>
    );
};
