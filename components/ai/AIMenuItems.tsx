/**
 * AI Context Menu Items
 * Reusable AI action items for context menus and dropdowns
 */

import React from 'react';
import {
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuItem,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Sparkles, FileText, Pencil, Tags, Filter, MessageCircle } from 'lucide-react';

interface AIMenuItemsProps {
    onSummarize?: () => void;
    onRewrite?: () => void;
    onClassify?: () => void;
    onExtract?: () => void;
    onAsk?: () => void;
    onGenerate?: () => void;
    disabled?: boolean;
}

/**
 * AI items for DropdownMenu
 */
export const AIDropdownMenuItems: React.FC<AIMenuItemsProps> = ({
    onSummarize,
    onRewrite,
    onClassify,
    onExtract,
    onAsk,
    onGenerate,
    disabled = false,
}) => (
    <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={disabled}>
            <Sparkles size={14} className="mr-2 text-primary" />
            AI Actions
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
            {onSummarize && (
                <DropdownMenuItem onClick={onSummarize}>
                    <FileText size={14} className="mr-2" />
                    Summarize
                </DropdownMenuItem>
            )}
            {onRewrite && (
                <DropdownMenuItem onClick={onRewrite}>
                    <Pencil size={14} className="mr-2" />
                    Rewrite
                </DropdownMenuItem>
            )}
            {onClassify && (
                <DropdownMenuItem onClick={onClassify}>
                    <Tags size={14} className="mr-2" />
                    Suggest Tags
                </DropdownMenuItem>
            )}
            {onExtract && (
                <DropdownMenuItem onClick={onExtract}>
                    <Filter size={14} className="mr-2" />
                    Extract Fields
                </DropdownMenuItem>
            )}
            {onGenerate && (
                <DropdownMenuItem onClick={onGenerate}>
                    <Sparkles size={14} className="mr-2" />
                    Generate Subtasks
                </DropdownMenuItem>
            )}
            {onAsk && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onAsk}>
                        <MessageCircle size={14} className="mr-2" />
                        Ask About This
                    </DropdownMenuItem>
                </>
            )}
        </DropdownMenuSubContent>
    </DropdownMenuSub>
);

/**
 * AI items for ContextMenu
 */
export const AIContextMenuItems: React.FC<AIMenuItemsProps> = ({
    onSummarize,
    onRewrite,
    onClassify,
    onExtract,
    onAsk,
    onGenerate,
    disabled = false,
}) => (
    <ContextMenuSub>
        <ContextMenuSubTrigger disabled={disabled}>
            <Sparkles size={14} className="mr-2 text-primary" />
            AI Actions
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
            {onSummarize && (
                <ContextMenuItem onClick={onSummarize}>
                    <FileText size={14} className="mr-2" />
                    Summarize
                </ContextMenuItem>
            )}
            {onRewrite && (
                <ContextMenuItem onClick={onRewrite}>
                    <Pencil size={14} className="mr-2" />
                    Rewrite
                </ContextMenuItem>
            )}
            {onClassify && (
                <ContextMenuItem onClick={onClassify}>
                    <Tags size={14} className="mr-2" />
                    Suggest Tags
                </ContextMenuItem>
            )}
            {onExtract && (
                <ContextMenuItem onClick={onExtract}>
                    <Filter size={14} className="mr-2" />
                    Extract Fields
                </ContextMenuItem>
            )}
            {onGenerate && (
                <ContextMenuItem onClick={onGenerate}>
                    <Sparkles size={14} className="mr-2" />
                    Generate Subtasks
                </ContextMenuItem>
            )}
            {onAsk && (
                <>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={onAsk}>
                        <MessageCircle size={14} className="mr-2" />
                        Ask About This
                    </ContextMenuItem>
                </>
            )}
        </ContextMenuSubContent>
    </ContextMenuSub>
);

/**
 * Simple inline AI button for use in card actions
 */
export const AIActionButton: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}> = ({ onClick, disabled = false, size = 'sm' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
      inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${size === 'sm' ? 'text-xs' : 'text-sm'}
    `}
        title="AI Actions"
    >
        <Sparkles size={size === 'sm' ? 12 : 14} />
    </button>
);
