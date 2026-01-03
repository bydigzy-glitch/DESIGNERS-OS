
import React, { useState } from 'react';
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
    GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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

export const QuickActionsSidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState<Note[]>([
        { id: '1', content: 'Apple HIG dark mode update complete. Check contrast ratios.', color: 'bg-yellow-200/20', createdAt: '2h ago' },
        { id: '2', content: 'Meeting with Client X at 3PM tomorrow.', color: 'bg-blue-200/20', createdAt: '5h ago' }
    ]);
    const [reminders, setReminders] = useState<Reminder[]>([
        { id: '1', text: 'Update project status', completed: false },
        { id: '2', text: 'Review team feedback', completed: true }
    ]);
    const [activeTab, setActiveTab] = useState<'notes' | 'reminders'>('notes');

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

    return (
        <motion.div
            initial={false}
            animate={{ width: isOpen ? 320 : 64 }}
            className="relative h-full flex flex-col bg-card/30 backdrop-blur-xl border-l border-border transition-all duration-300 ease-in-out z-50 overflow-hidden"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
                {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Tabs / Icons only when collapsed */}
            <div className={`flex flex-col items-center gap-6 pt-16 ${isOpen ? 'px-6' : 'px-0'}`}>
                {!isOpen && (
                    <div className="flex flex-col gap-6">
                        <button
                            onClick={() => { setIsOpen(true); setActiveTab('notes') }}
                            className="p-3 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-all"
                            aria-label="View Notes"
                        >
                            <StickyNote size={24} />
                        </button>
                        <button
                            onClick={() => { setIsOpen(true); setActiveTab('reminders') }}
                            className="p-3 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-all"
                            aria-label="View Reminders"
                        >
                            <Bell size={24} />
                        </button>
                    </div>
                )}

                {isOpen && (
                    <div className="w-full flex flex-col h-[calc(100vh-100px)]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
                        </div>

                        <div className="flex gap-2 p-1 bg-secondary/30 rounded-xl mb-6">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <StickyNote size={14} />
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('reminders')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'reminders' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Bell size={14} />
                                Reminders
                            </button>
                        </div>

                        <ScrollArea className="flex-1 -mx-2 px-2">
                            <AnimatePresence mode="wait">
                                {activeTab === 'notes' ? (
                                    <motion.div
                                        key="notes"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Recent Notes</span>
                                            <Button variant="ghost" size="icon" onClick={addNote} className="h-6 w-6 rounded-full hover:bg-secondary/50" aria-label="Add Note">
                                                <Plus size={14} />
                                            </Button>
                                        </div>
                                        {notes.map(note => (
                                            <div key={note.id} className={`p-4 rounded-2xl border border-white/5 ${note.color} group relative hover:shadow-lg transition-all`}>
                                                <textarea
                                                    defaultValue={note.content}
                                                    placeholder="Type something..."
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-muted-foreground/50"
                                                />
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] text-muted-foreground/60">{note.createdAt}</span>
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive" aria-label="Delete Note">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="reminders"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">To-Do</span>
                                            <Button variant="ghost" size="icon" onClick={addReminder} className="h-6 w-6 rounded-full hover:bg-secondary/50" aria-label="Add Reminder">
                                                <Plus size={14} />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {reminders.map(reminder => (
                                                <div key={reminder.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all border border-transparent hover:border-white/5 group">
                                                    <button onClick={() => toggleReminder(reminder.id)} className="text-primary hover:scale-110 transition-transform">
                                                        {reminder.completed ? <CheckCircle2 size={18} fill="currentColor" strokeWidth={1} /> : <Circle size={18} className="text-muted-foreground" />}
                                                    </button>
                                                    <input
                                                        defaultValue={reminder.text}
                                                        placeholder="Add reminder..."
                                                        className={`flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-muted-foreground/50 ${reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                                    />
                                                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground" aria-label="More options">
                                                        <MoreVertical size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                    </div>
                )}
            </div>

            {/* Footer / User Info could go here */}
            {
                isOpen && (
                    <div className="p-6 border-t border-border mt-auto">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Focus Mode</p>
                            <p className="text-xs text-muted-foreground">Keep your workspace clean and tools handy.</p>
                        </div>
                    </div>
                )
            }
        </motion.div >
    );
};
