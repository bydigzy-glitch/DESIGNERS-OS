
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    StickyNote,
    Bell,
    Plus,
    X,
    CheckCircle2,
    Circle,
    MoreVertical,
    GripVertical,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { InvoiceMaker } from './InvoiceMaker';

interface Note {
    id: string;
    content: string;
    color: string;
    createdAt: string;
}

interface Reminder {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
}

const QuickTool: React.FC<{
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onHover: (hovered: boolean) => void;
    isTyping: boolean;
}> = ({ icon: Icon, title, children, isOpen, onHover, isTyping }) => {
    return (
        <motion.div
            initial={false}
            animate={{
                width: (isOpen || isTyping) ? 400 : 48,
                height: (isOpen || isTyping) ? 600 : 48,
                borderRadius: (isOpen || isTyping) ? 24 : 12,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            className={`flex flex-col bg-card/40 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto transition-colors ${(isOpen || isTyping) ? 'bg-card/90 z-50' : 'hover:bg-primary/10'}`}
        >
            <div className="flex items-center h-12 min-h-[48px] px-4 cursor-pointer">
                <div className="flex-shrink-0">
                    <Icon size={18} className={(isOpen || isTyping) ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                {(isOpen || isTyping) && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-3 font-bold text-sm tracking-tight"
                    >
                        {title}
                    </motion.span>
                )}
            </div>

            {(isOpen || isTyping) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 overflow-hidden flex flex-col p-6 pt-0"
                >
                    {children}
                </motion.div>
            )}
        </motion.div>
    );
};

export const QuickActionsSidebar: React.FC = () => {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = localStorage.getItem('designers-os-notes');
        return saved ? JSON.parse(saved) : [
            { id: '1', content: 'Apple HIG dark mode update complete. Check contrast ratios.', color: 'bg-yellow-200/20', createdAt: '2h ago' },
            { id: '2', content: 'Meeting with Client X at 3PM tomorrow.', color: 'bg-blue-200/20', createdAt: '5h ago' }
        ];
    });

    const [reminders, setReminders] = useState<Reminder[]>(() => {
        const saved = localStorage.getItem('designers-os-reminders');
        return saved ? JSON.parse(saved) : [
            { id: '1', text: 'Update project status', completed: false },
            { id: '2', text: 'Review team feedback', completed: true }
        ];
    });

    useEffect(() => {
        localStorage.setItem('designers-os-notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('designers-os-reminders', JSON.stringify(reminders));
    }, [reminders]);

    const addNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            content: '',
            color: 'bg-primary/10',
            createdAt: 'Just now'
        };
        setNotes([newNote, ...notes]);
    };

    const addReminder = () => {
        const newReminder: Reminder = {
            id: Date.now().toString(),
            text: '',
            completed: false
        };
        setReminders([newReminder, ...reminders]);
    };

    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    };

    const deleteReminder = (id: string) => {
        setReminders(prev => prev.filter(r => r.id !== id));
    };

    const updateReminder = (id: string, text: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, text } : r));
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-end gap-3 z-[100] pointer-events-none">
            {/* Notes Tool */}
            <QuickTool
                icon={StickyNote}
                title="Notes"
                isOpen={hoveredTool === 'notes'}
                onHover={(h) => setHoveredTool(h ? 'notes' : null)}
                isTyping={isTyping && hoveredTool === 'notes'}
            >
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Recent Notes</span>
                        <Button variant="ghost" size="icon" onClick={addNote} className="h-6 w-6 rounded-full hover:bg-secondary/50">
                            <Plus size={11} />
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-4">
                            {notes.map(note => (
                                <div key={note.id} className={`p-4 rounded-2xl border border-white/5 ${note.color} group relative hover:shadow-lg transition-all`}>
                                    <textarea
                                        value={note.content}
                                        onChange={(e) => updateNote(note.id, e.target.value)}
                                        placeholder="Type something..."
                                        onFocus={() => { setIsTyping(true); setHoveredTool('notes'); }}
                                        onBlur={() => setIsTyping(false)}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-muted-foreground/50"
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-muted-foreground/60">{note.createdAt}</span>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                                            aria-label="Delete Note"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </QuickTool>

            {/* Reminders Tool */}
            <QuickTool
                icon={Bell}
                title="Reminders"
                isOpen={hoveredTool === 'reminders'}
                onHover={(h) => setHoveredTool(h ? 'reminders' : null)}
                isTyping={isTyping && hoveredTool === 'reminders'}
            >
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">To-Do</span>
                        <Button variant="ghost" size="icon" onClick={addReminder} className="h-6 w-6 rounded-full hover:bg-secondary/50">
                            <Plus size={11} />
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-2">
                            {reminders.map(reminder => (
                                <div key={reminder.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all border border-transparent hover:border-white/5 group">
                                    <button onClick={() => toggleReminder(reminder.id)} className="text-primary hover:scale-110 transition-transform">
                                        {reminder.completed ? <CheckCircle2 size={14} fill="currentColor" strokeWidth={1} /> : <Circle size={14} className="text-muted-foreground" />}
                                    </button>
                                    <input
                                        value={reminder.text}
                                        onChange={(e) => updateReminder(reminder.id, e.target.value)}
                                        placeholder="Add reminder..."
                                        onFocus={() => { setIsTyping(true); setHoveredTool('reminders'); }}
                                        onBlur={() => setIsTyping(false)}
                                        className={`flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-muted-foreground/50 ${reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                    />
                                    <button
                                        onClick={() => deleteReminder(reminder.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground"
                                        aria-label="Delete Reminder"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </QuickTool>

            {/* Invoice Maker Tool */}
            <QuickTool
                icon={FileText}
                title="Invoice Maker"
                isOpen={hoveredTool === 'invoice'}
                onHover={(h) => setHoveredTool(h ? 'invoice' : null)}
                isTyping={isTyping && hoveredTool === 'invoice'}
            >
                <div className="flex-1 overflow-hidden"
                    onFocus={() => { setIsTyping(true); setHoveredTool('invoice'); }}
                    onBlur={() => setIsTyping(false)}>
                    <ScrollArea className="h-full -mx-6 px-6">
                        <InvoiceMaker />
                    </ScrollArea>
                </div>
            </QuickTool>
        </div>
    );
};
