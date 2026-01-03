/**
 * AI Preview Dialog
 * Shows preview of AI output with diff and apply/cancel options
 */

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIResponse, AIPreview, AIDiff } from '../../services/ai/types';
import { Check, X, AlertCircle, Info, Plus, Pencil, Trash2 } from 'lucide-react';

interface AIPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    response: AIResponse;
    onApply: (result: any) => void;
    onCancel: () => void;
}

const DiffView: React.FC<{ diff: AIDiff }> = ({ diff }) => (
    <div className="space-y-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs font-medium text-red-500 mb-1">Before</div>
            <div className="text-sm text-foreground/80 whitespace-pre-wrap">{diff.before}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="text-xs font-medium text-green-500 mb-1">After</div>
            <div className="text-sm text-foreground whitespace-pre-wrap">{diff.after}</div>
        </div>
    </div>
);

const PreviewIcon: React.FC<{ type: AIPreview['type'] }> = ({ type }) => {
    switch (type) {
        case 'create':
            return <Plus size={16} className="text-green-500" />;
        case 'update':
            return <Pencil size={16} className="text-blue-500" />;
        case 'delete':
            return <Trash2 size={16} className="text-red-500" />;
        default:
            return <Info size={16} className="text-muted-foreground" />;
    }
};

export const AIPreviewDialog: React.FC<AIPreviewDialogProps> = ({
    open,
    onOpenChange,
    response,
    onApply,
    onCancel,
}) => {
    const { output, preview } = response;

    if (!output.success) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle size={18} className="text-destructive" />
                            AI Error
                        </DialogTitle>
                        <DialogDescription>
                            {output.humanReadable}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={onCancel}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {preview && <PreviewIcon type={preview.type} />}
                        {preview?.title || 'AI Result'}
                    </DialogTitle>
                    {preview?.description && (
                        <DialogDescription>{preview.description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {/* Confidence Badge */}
                    {output.confidence !== undefined && (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {Math.round(output.confidence * 100)}% confidence
                            </Badge>
                        </div>
                    )}

                    {/* Diff View */}
                    {preview?.diff && <DiffView diff={preview.diff} />}

                    {/* Items Preview */}
                    {preview?.items && preview.items.length > 0 && (
                        <div className="space-y-2">
                            {preview.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border"
                                >
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                                        {item.value && (
                                            <div className="text-xs text-muted-foreground">{item.value}</div>
                                        )}
                                    </div>
                                    {item.type === 'tag' && (
                                        <Badge variant="outline" className="text-xs">{item.value}</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Human Readable Output */}
                    {!preview?.diff && !preview?.items?.length && output.humanReadable && (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div
                                className="text-sm text-foreground whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: output.humanReadable
                                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold mt-4 mb-2">$1</h4>')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                                        .replace(/_(.*?)_/g, '<em class="text-muted-foreground">$1</em>')
                                }}
                            />
                        </div>
                    )}

                    {/* Assumptions */}
                    {output.assumptions && output.assumptions.length > 0 && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="text-xs font-medium text-yellow-600 mb-1">Assumptions</div>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                {output.assumptions.map((assumption, i) => (
                                    <li key={i}>• {assumption}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        <X size={14} className="mr-1" />
                        Cancel
                    </Button>
                    {(preview?.type === 'create' || preview?.type === 'update') && (
                        <Button onClick={() => onApply(output.data)}>
                            <Check size={14} className="mr-1" />
                            Apply Changes
                        </Button>
                    )}
                    {preview?.type === 'info' && (
                        <Button variant="secondary" onClick={onCancel}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
