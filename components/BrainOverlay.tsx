
import React, { useState, useRef, useEffect } from 'react';
import {
    X,
    Send,
    Brain,
    Zap,
    Shield,
    HelpCircle,
    Loader2,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message, AutopilotMode, User, Task } from '../types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BrainOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string) => void;

    user: User | null;
}



const QUICK_ACTIONS = [
    { label: "What should I focus on?", icon: <Sparkles size={14} /> },
    { label: "Any red flags today?", icon: <Zap size={14} /> },
    { label: "Am I undercharging?", icon: <ArrowRight size={14} /> },
];

export const BrainOverlay: React.FC<BrainOverlayProps> = ({
    isOpen,
    onClose,
    messages,
    isLoading,
    onSendMessage,

    user,
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);


    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleQuickAction = (text: string) => {
        onSendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:bg-transparent md:backdrop-blur-none"
                onClick={onClose}
            />

            {/* Overlay Panel */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-background border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-calm-pulse">
                            <Brain size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">Brain</h2>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-calm-pulse">
                                <Brain size={32} className="text-primary" />
                            </div>
                            <h3 className="font-bold text-foreground mb-2">Systems Stable</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px] mb-8">
                                No urgent work. The system is monitoring your income, time, and mental health.
                            </p>

                            {/* Quick Actions */}
                            <div className="space-y-2 w-full max-w-[280px]">
                                {QUICK_ACTIONS.map((action, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full justify-start gap-2 text-xs h-9"
                                        onClick={() => handleQuickAction(action.label)}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-md'
                                            : 'bg-secondary text-foreground rounded-bl-md'
                                            }`}
                                    >
                                        {msg.role === 'model' && (
                                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                                                <Brain size={12} className="text-primary" />
                                                <span>Brain</span>
                                            </div>
                                        )}
                                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {msg.text}
                                        </div>
                                        <div className="text-[10px] opacity-60 mt-2">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border">
                    <form onSubmit={handleSubmit} className="relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Brain anything..."
                            className="w-full min-h-[80px] max-h-[150px] resize-none bg-secondary rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="absolute bottom-3 right-3 h-8 w-8"
                        >
                            <Send size={14} />
                        </Button>
                    </form>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground px-1">
                        <span>Enter to send, Shift+Enter for new line</span>
                    </div>
                </div>
            </div>
        </>
    );
};
