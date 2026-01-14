
import React from 'react';
import { Brain, Zap, Shield, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Message, AutopilotMode, User, Task, Project, Client, ChatSession } from '../types';
import { ChatInterface } from './ChatInterface';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface BrainPageProps {
    user: User | null;
    messages: Message[];
    isLoading: boolean;
    loadingStep?: string;
    onSendMessage: (text: string, image?: string, isIgnite?: boolean, mentionedTaskIds?: string[]) => void;
    onStopGeneration?: () => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: string) => void;
    tasks: Task[];
    projects: Project[];
    clients: Client[];
    autopilotMode: AutopilotMode;
}

const MODE_CONFIG: Record<AutopilotMode, { label: string; icon: React.ReactNode; color: string; description: string }> = {
    ASSIST: {
        label: 'Assist',
        icon: <HelpCircle size={14} />,
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        description: 'System focuses on clarification and guidance.'
    },
    CONFIDENT: {
        label: 'Confident',
        icon: <Zap size={14} />,
        color: 'text-primary bg-primary/10 border-primary/20',
        description: 'Balanced automation with strategic suggestions.'
    },
    STRICT: {
        label: 'Strict',
        icon: <Shield size={14} />,
        color: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        description: 'Maximum intervention for performance optimization.'
    },
};

export const BrainPage: React.FC<BrainPageProps> = (props) => {
    const modeConfig = MODE_CONFIG[props.autopilotMode];

    return (
        <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
            {/* Brain Status Bar - Unique Header for Brain View */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0 border-b border-border/50 px-6 py-4 bg-background/80 backdrop-blur-md z-10"
            >
                <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-calm-pulse border border-primary/20 shadow-sm shadow-primary/5">
                            <Brain size={24} className="text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-foreground">Brain AI</h1>
                                <Badge variant="outline" className={`gap-1.5 py-0.5 px-2.5 font-bold tracking-tight ${modeConfig.color}`}>
                                    {modeConfig.icon}
                                    {modeConfig.label} MODE
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium opacity-70 italic">
                                {modeConfig.description}
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-60">System Context</p>
                            <p className="text-sm font-semibold text-foreground">
                                {props.tasks.filter(t => !t.completed).length} Tasks • {props.projects.filter(p => p.status === 'ACTIVE').length} Projects
                            </p>
                        </div>
                        <div className="h-10 w-[1px] bg-border/50" />
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-60">Brain Status</p>
                            <p className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5 justify-end">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Synchronized
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Chat Area */}
            <div className="flex-1 min-h-0 relative">
                <ChatInterface
                    {...props}
                    hideSidebar={false} // Brain view should probably have its own session sidebar or just be a clean room
                />
            </div>
        </div>
    );
};
