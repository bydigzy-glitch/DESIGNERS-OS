

import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { Flame, Plus, Check, X, Trash2, RotateCcw, BookOpen, Dumbbell, Coffee, Target, Mail, Moon, Brain, PenTool, Users, Briefcase } from 'lucide-react';
import { FadeIn } from './common/AnimatedComponents';
import { Button } from '@/components/ui/button';

interface HabitsPageProps {
    habits: Habit[];
    setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const PRESETS: { title: string, category: 'WORK' | 'HEALTH' | 'MINDSET', icon: React.ReactNode }[] = [
    { title: 'Deep Work (2h)', category: 'WORK', icon: <Briefcase size={14} /> },
    { title: 'Read 20 pages', category: 'MINDSET', icon: <BookOpen size={14} /> },
    { title: 'Workout', category: 'HEALTH', icon: <Dumbbell size={14} /> },
    { title: 'Zero Sugar', category: 'HEALTH', icon: <Coffee size={14} /> },
    { title: 'Review Goals', category: 'MINDSET', icon: <Target size={14} /> },
    { title: 'Inbox Zero', category: 'WORK', icon: <Mail size={14} /> },
    { title: 'Sleep 8h', category: 'HEALTH', icon: <Moon size={14} /> },
    { title: 'Meditate', category: 'MINDSET', icon: <Brain size={14} /> },
    { title: 'Content Post', category: 'WORK', icon: <PenTool size={14} /> },
    { title: 'Network Outreach', category: 'WORK', icon: <Users size={14} /> },
];

export const HabitsPage: React.FC<HabitsPageProps> = ({ habits, setHabits }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [newHabitCategory, setNewHabitCategory] = useState<'HEALTH' | 'WORK' | 'MINDSET'>('WORK');
    const [isDirty, setIsDirty] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (newHabitTitle) setIsDirty(true);
        else setIsDirty(false);
    }, [newHabitTitle]);

    const today = new Date().toISOString().split('T')[0];

    // Calculate stats
    const totalStreaks = habits.reduce((acc, h) => acc + h.streak, 0);
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    const completionRate = habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;

    const toggleHabit = (id: string) => {
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const isCompleted = h.completedDates.includes(today);
                let newDates = [...h.completedDates];
                let newStreak = h.streak;

                if (isCompleted) {
                    newDates = newDates.filter(d => d !== today);
                    if (newStreak > 0) newStreak--;
                } else {
                    newDates.push(today);
                    newStreak++;
                }
                return { ...h, completedDates: newDates, streak: newStreak };
            }
            return h;
        }));
    };

    const addHabit = async (habit?: Partial<Habit>) => {
        const title = habit?.title || newHabitTitle;

        if (!title.trim()) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        const newH: Habit = {
            id: Date.now().toString() + Math.random(),
            title: title,
            category: habit?.category || newHabitCategory,
            frequency: 'DAILY',
            streak: 0,
            completedDates: []
        };

        // Update local state immediately
        setHabits(prev => [...prev, newH]);
        closeModal();

        // Sync to Supabase (import needed at top of file)
        try {
            const { db } = await import('../services/supabaseClient');
            const { data: { user } } = await import('../services/supabaseClient').then(m => m.supabase.auth.getUser());

            if (user && !user.user_metadata?.isGuest) {
                await db.habits.create({
                    id: newH.id,
                    user_id: user.id,
                    title: newH.title,
                    category: newH.category,
                    frequency: newH.frequency,
                    streak: newH.streak,
                    completed_dates: newH.completedDates
                });
                console.log('[Habits] Synced to Supabase:', newH.id);
            }
        } catch (e) {
            console.error('[Habits] Failed to sync to Supabase:', e);
        }
    };

    const deleteHabit = async (id: string) => {
        if (confirm('Delete this habit?')) {
            // Update local state immediately
            setHabits(prev => prev.filter(h => h.id !== id));

            // Sync to Supabase
            try {
                const { db } = await import('../services/supabaseClient');
                const { data: { user } } = await import('../services/supabaseClient').then(m => m.supabase.auth.getUser());

                if (user && !user.user_metadata?.isGuest) {
                    await db.habits.delete(id);
                    console.log('[Habits] Deleted from Supabase:', id);
                }
            } catch (e) {
                console.error('[Habits] Failed to delete from Supabase:', e);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewHabitTitle('');
        setIsDirty(false);
    };

    const handleBackdropClick = () => {
        if (!isDirty) {
            closeModal();
        } else {
            // Visual feedback that action is blocked
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'HEALTH': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'WORK': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'MINDSET': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            default: return 'text-gray-500';
        }
    };

    return (
        <FadeIn className="flex flex-col h-full w-full overflow-y-auto pb-32 md:pb-0 scrollbar-hide space-y-8 pr-2">

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Habit Tracker</h1>
                    <p className="text-sm text-muted-foreground">Discipline equals freedom.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} /> Add Habit
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Flame size={20} /></div>
                        <span className="text-sm font-bold text-muted-foreground">TOTAL STREAK</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground">{totalStreaks} <span className="text-lg text-muted-foreground">days</span></div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Check size={20} /></div>
                        <span className="text-sm font-bold text-muted-foreground">DONE TODAY</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground">{completedToday}<span className="text-lg text-muted-foreground">/{habits.length}</span></div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><RotateCcw size={20} /></div>
                        <span className="text-sm font-bold text-muted-foreground">COMPLETION</span>
                    </div>
                    <div className="text-4xl font-bold text-foreground relative z-10">{completionRate}%</div>
                    <div className="absolute bottom-0 left-0 h-1.5 bg-secondary w-full">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Habits List */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h3 className="font-bold text-lg">Daily Habits</h3>
                </div>
                <div className="divide-y divide-border">
                    {habits.map(habit => {
                        const isDone = habit.completedDates.includes(today);
                        return (
                            <div key={habit.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleHabit(habit.id)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-primary'}`}
                                    >
                                        {isDone && <Check size={18} strokeWidth={3} />}
                                    </button>
                                    <div>
                                        <div className={`font-bold text-base ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{habit.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(habit.category)}`}>{habit.category}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Flame size={12} className={habit.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                                                {habit.streak} streak
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteHabit(habit.id)}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all h-8 w-8"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        );
                    })}
                    {habits.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground">
                            No habits tracked yet. Add one to start your streak.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={handleBackdropClick}>
                    <div
                        className={`bg-card border border-border p-6 rounded-3xl w-full max-w-lg transition-transform ${shake ? 'animate-shake' : ''}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-xl text-foreground">Create New Habit</h3>
                                <p className="text-xs text-muted-foreground">What do you want to achieve daily?</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closeModal}>
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Habit Name</label>
                                <input
                                    value={newHabitTitle}
                                    onChange={e => setNewHabitTitle(e.target.value)}
                                    className="w-full bg-secondary border border-border rounded-xl p-3 text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                    placeholder="e.g. Read 10 pages"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Category</label>
                                <div className="flex gap-2">
                                    {['WORK', 'HEALTH', 'MINDSET'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewHabitCategory(cat as any)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${newHabitCategory === cat ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border">
                                <label className="text-xs font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Quick Presets</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRESETS.map((p, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addHabit(p)}
                                            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-xs text-left group transition-all hover:border-primary/50"
                                        >
                                            <span className="text-muted-foreground group-hover:text-primary transition-colors">{p.icon}</span>
                                            <span className="font-medium">{p.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => addHabit()}
                                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold mt-4 shadow-glow hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Create Custom Habit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FadeIn>
    );
};
