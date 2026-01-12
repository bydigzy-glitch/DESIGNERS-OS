
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
    ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

interface QuickTask {
    id: string;
    text: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    completed: boolean;
}

export const QuickActionsSidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'notes' | 'reminders' | 'tasks'>('notes');
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

    const [tasks, setTasks] = useState<QuickTask[]>(() => {
        const saved = localStorage.getItem('designers-os-quick-tasks');
        return saved ? JSON.parse(saved) : [
            { id: '1', text: 'Finalize brand guidelines', priority: 'HIGH', completed: false },
            { id: '2', text: 'Send weekly update to client', priority: 'MEDIUM', completed: false }
        ];
    });

    useEffect(() => {
        localStorage.setItem('designers-os-notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('designers-os-reminders', JSON.stringify(reminders));
    }, [reminders]);

    useEffect(() => {
        localStorage.setItem('designers-os-quick-tasks', JSON.stringify(tasks));
    }, [tasks]);

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

    const addTask = () => {
        const newTask: QuickTask = {
            id: Date.now().toString(),
            text: '',
            priority: 'MEDIUM',
            completed: false
        };
        setTasks([newTask, ...tasks]);
    };

    const toggleReminder = (id: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    };

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    };

    const updateReminder = (id: string, text: string) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, text } : r));
    };

    const updateTask = (id: string, text: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    };

    const cyclePriority = (id: string) => {
        const priorityOrder: QuickTask['priority'][] = ['LOW', 'MEDIUM', 'HIGH'];
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                const currentIndex = priorityOrder.indexOf(t.priority);
                const nextIndex = (currentIndex + 1) % priorityOrder.length;
                return { ...t, priority: priorityOrder[nextIndex] };
            }
            return t;
        }));
    };

    const deleteNote = (id: string) => setNotes(notes.filter(n => n.id !== id));
    const deleteReminder = (id: string) => setReminders(reminders.filter(r => r.id !== id));
    const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

    return (
        <motion.div
            initial={false}
            animate={{ width: isOpen ? 320 : 64 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen sticky top-0 flex flex-col bg-card/30 backdrop-blur-xl border-l border-border z-50 overflow-hidden shadow-2xl"
        >
            {/* Header / Toggle */}
            <div className="flex items-center h-16 px-4 border-b border-white/5 bg-background/20">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-all active:scale-95"
                    aria-label={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                {isOpen && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="ml-2 text-overline opacity-40"
                    >
                        Quick Actions
                    </motion.span>
                )}
            </div>

            {/* Sidebar Navigation */}
            <div className={`flex flex-col items-center gap-4 py-6 ${isOpen ? 'px-4' : 'px-0'}`}>
                {!isOpen ? (
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => { setIsOpen(true); setActiveTab('notes'); }}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${activeTab === 'notes' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary/50'}`}
                            aria-label="View Notes"
                        >
                            <StickyNote size={20} />
                        </button>
                        <button
                            onClick={() => { setIsOpen(true); setActiveTab('reminders'); }}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${activeTab === 'reminders' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary/50'}`}
                            aria-label="View Reminders"
                        >
                            <Bell size={20} />
                        </button>
                        <button
                            onClick={() => { setIsOpen(true); setActiveTab('tasks'); }}
                            className={`p-3 rounded-xl transition-all active:scale-95 ${activeTab === 'tasks' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary/50'}`}
                            aria-label="View Quick Tasks"
                        >
                            <ClipboardList size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex gap-1 p-1 bg-secondary/30 rounded-2xl mb-4">
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${activeTab === 'notes' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label="Notes Tab"
                            title="Notes"
                        >
                            <StickyNote size={14} />
                        </button>
                        <button
                            onClick={() => setActiveTab('reminders')}
                            className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${activeTab === 'reminders' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label="Reminders Tab"
                            title="Reminders"
                        >
                            <Bell size={14} />
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`flex-1 flex justify-center py-2 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-background shadow-sm text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                            aria-label="Tasks Tab"
                            title="Tasks"
                        >
                            <ClipboardList size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col min-h-0 px-4 pb-4"
                    >
                        <div className="flex justify-between items-baseline mb-6">
                            <h3 className="text-h2 capitalize">
                                {activeTab === 'tasks' ? 'Quick Tasks' : activeTab}
                            </h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Add ${activeTab}`}
                                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary active:scale-90 transition-transform"
                                onClick={() => {
                                    if (activeTab === 'notes') addNote();
                                    if (activeTab === 'reminders') addReminder();
                                    if (activeTab === 'tasks') addTask();
                                }}
                            >
                                <Plus size={16} />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 -mx-2 px-2">
                            <AnimatePresence mode="wait">
                                {activeTab === 'notes' && (
                                    <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                        {notes.map(note => (
                                            <div key={note.id} className={`p-4 rounded-2xl border border-white/5 ${note.color} group relative transition-all shadow-sm hover:shadow-md bg-opacity-30`}>
                                                <textarea
                                                    value={note.content}
                                                    onChange={(e) => updateNote(note.id, e.target.value)}
                                                    onFocus={() => setIsTyping(true)}
                                                    onBlur={() => setIsTyping(false)}
                                                    placeholder="Start writing..."
                                                    className="w-full bg-transparent border-none focus:ring-0 text-caption resize-none h-24 placeholder:text-muted-foreground/30 leading-relaxed"
                                                />
                                                <div className="flex justify-between items-center mt-2 border-t border-black/5 pt-2">
                                                    <span className="text-overline opacity-40">{note.createdAt}</span>
                                                    <button onClick={() => deleteNote(note.id)} aria-label="Delete note" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'reminders' && (
                                    <motion.div key="reminders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                                        {reminders.map(reminder => (
                                            <div key={reminder.id} className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-white/5 group transition-all">
                                                <button onClick={() => toggleReminder(reminder.id)} aria-label={reminder.completed ? "Unmark reminder" : "Mark reminder completed"} className="text-primary transition-transform hover:scale-110">
                                                    {reminder.completed ? <CheckCircle2 size={18} fill="currentColor" strokeWidth={1} /> : <Circle size={18} className="text-muted-foreground/40" />}
                                                </button>
                                                <input
                                                    value={reminder.text}
                                                    onChange={(e) => updateReminder(reminder.id, e.target.value)}
                                                    onFocus={() => setIsTyping(true)}
                                                    onBlur={() => setIsTyping(false)}
                                                    placeholder="Task name"
                                                    aria-label="Reminder text"
                                                    className={`flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold p-0 ${reminder.completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}
                                                />
                                                <button onClick={() => deleteReminder(reminder.id)} aria-label="Delete reminder" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'tasks' && (
                                    <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                        {tasks.map(task => (
                                            <div key={task.id} className="p-4 rounded-2xl bg-secondary/20 border border-white/5 hover:bg-secondary/40 group transition-all">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <button onClick={() => toggleTask(task.id)} aria-label={task.completed ? "Unmark task" : "Mark task completed"} className="text-primary hover:scale-110 transition-transform">
                                                        {task.completed ? <CheckCircle2 size={18} fill="currentColor" /> : <Circle size={18} className="text-muted-foreground/40" />}
                                                    </button>
                                                    <input
                                                        value={task.text}
                                                        onChange={(e) => updateTask(task.id, e.target.value)}
                                                        onFocus={() => setIsTyping(true)}
                                                        onBlur={() => setIsTyping(false)}
                                                        placeholder="Task description"
                                                        aria-label="Task description"
                                                        className={`flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-0 ${task.completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center ml-8">
                                                    <button
                                                        onClick={() => cyclePriority(task.id)}
                                                        aria-label={`Priority: ${task.priority}. Click to cycle.`}
                                                        className={`text-overline px-2 py-0.5 rounded-full border border-current transition-colors ${task.priority === 'HIGH' ? 'text-red-500 bg-red-500/10' :
                                                            task.priority === 'MEDIUM' ? 'text-blue-500 bg-blue-500/10' :
                                                                'text-muted-foreground/50 bg-secondary/50'
                                                            }`}
                                                    >
                                                        {task.priority} Priority
                                                    </button>
                                                    <button onClick={() => deleteTask(task.id)} aria-label="Delete task" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
