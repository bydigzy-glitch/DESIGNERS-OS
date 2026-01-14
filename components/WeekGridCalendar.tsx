
import React, { useState, useMemo } from 'react';
import { Task, Project } from '../types';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Settings,
    Check,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Search,
    Bell,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WeekGridCalendarProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Modern pastel colors for event types
const CATEGORY_COLORS: Record<string, { bg: string, text: string, accent: string }> = {
    'MEETING': { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-400' },
    'DELIVERABLE': { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'bg-emerald-400' },
    'CLIENT': { bg: 'bg-orange-50', text: 'text-orange-700', accent: 'bg-orange-400' },
    'CALL': { bg: 'bg-purple-50', text: 'text-purple-700', accent: 'bg-purple-400' },
    'PERSONAL': { bg: 'bg-pink-50', text: 'text-pink-700', accent: 'bg-pink-400' },
    'DEFAULT': { bg: 'bg-slate-50', text: 'text-slate-700', accent: 'bg-slate-400' },
};

const COLLABORATORS = [
    { name: 'Sarah L.', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { name: 'Marcus K.', avatar: 'https://i.pravatar.cc/150?u=marcus' },
    { name: 'Elena R.', avatar: 'https://i.pravatar.cc/150?u=elena' },
];

export const WeekGridCalendar: React.FC<WeekGridCalendarProps> = ({
    tasks,
    projects,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedFilters, setSelectedFilters] = useState<string[]>(['Team Meetings', 'Tasks', 'Client Work']);

    // Calculate dates for the current week (Sun-Sat)
    const weekDates = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Helper to calculate event position
    const getEventStyles = (taskDate: Date, durationMinutes: number) => {
        const startHour = taskDate.getHours();
        const startMinute = taskDate.getMinutes();

        // Start position (relative to 8 AM)
        const hourPos = (startHour - 8) * 80; // 80px per hour
        const minutePos = (startMinute / 60) * 80;
        const top = hourPos + minutePos;

        // Height position
        const height = (durationMinutes / 60) * 80;

        return { top: `${top}px`, height: `${height}px` };
    };

    const navigateWeek = (dir: 'prev' | 'next') => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + (dir === 'next' ? 7 : -7));
        setCurrentDate(next);
    };

    return (
        <div className="flex h-full w-full bg-[#FAFAFA] rounded-3xl border border-border overflow-hidden shadow-2xl">
            {/* LEFT SIDEBAR */}
            <aside className="w-[280px] bg-[#121212] flex flex-col shrink-0 text-white/90">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <CalendarIcon size={18} className="text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-white">Chronos UI</span>
                    </div>

                    {/* MINI CALENDAR PLACEHOLDER */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4 px-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-white/40">January 2026</span>
                            <div className="flex gap-1">
                                <ChevronLeft size={14} className="text-white/40 hover:text-white cursor-pointer" />
                                <ChevronRight size={14} className="text-white/40 hover:text-white cursor-pointer" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] text-white/30 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                            {Array.from({ length: 31 }, (_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer transition-colors",
                                        i + 1 === 14 ? "bg-primary text-white font-bold" : ""
                                    )}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="space-y-6">
                        <div className="px-1">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Calendars</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'My Events', dot: 'bg-blue-400' },
                                    { label: 'Marketing Team', dot: 'bg- emerald-400' },
                                    { label: 'Interviews', dot: 'bg-orange-400' },
                                    { label: 'Events Planning', dot: 'bg-purple-400' },
                                    { label: 'Holidays', dot: 'bg-pink-400' },
                                ].map((filter) => (
                                    <div key={filter.label} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-2 h-2 rounded-full", filter.dot)} />
                                            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                                                {filter.label}
                                            </span>
                                        </div>
                                        <Checkbox className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-white/20">
                            <AvatarImage src="https://i.pravatar.cc/150?u=me" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">Justin Digzy</p>
                            <p className="text-[10px] text-white/40 truncate">Free Professional</p>
                        </div>
                        <Settings size={16} className="text-white/40 hover:text-white cursor-pointer" />
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col bg-white">
                {/* HEADER BAR */}
                <header className="h-[80px] border-b border-border/50 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-6">
                        <h2 className="text-2xl font-bold tracking-tight text-[#121212]">{monthYearLabel}</h2>

                        <div className="flex items-center -space-x-2 ml-4">
                            {COLLABORATORS.map(collab => (
                                <Avatar key={collab.name} className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-border/20">
                                    <AvatarImage src={collab.avatar} />
                                    <AvatarFallback>{collab.name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground border-2 border-white shadow-sm ring-1 ring-border/20">
                                +4
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-secondary/50 border border-border/50 rounded-xl">
                            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} className="h-8 w-8 rounded-lg">
                                <ChevronLeft size={16} />
                            </Button>
                            <Button variant="ghost" className="h-8 text-xs font-bold px-3 rounded-lg" onClick={() => setCurrentDate(new Date())}>
                                Today
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} className="h-8 w-8 rounded-lg">
                                <ChevronRight size={16} />
                            </Button>
                        </div>

                        <div className="h-6 w-[1px] bg-border/50 mx-2" />

                        <div className="flex items-center gap-2">
                            <Button className="bg-[#121212] text-white hover:bg-black font-bold h-10 px-5 rounded-xl shadow-lg shadow-black/5">
                                <Plus size={16} className="mr-2" /> New Event
                            </Button>
                            <Button variant="outline" className="h-10 px-4 rounded-xl font-bold text-xs">
                                Week View
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto scrollbar-hide relative bg-[#FAFAFA]">
                    {/* WEEK GRID */}
                    <div className="min-w-[1000px] h-full flex flex-col">
                        {/* DAY NAMES HEADER */}
                        <div className="flex border-b border-border/30 bg-[#FAFAFA]/95 backdrop-blur-sm sticky top-0 z-10 pt-4 pb-2">
                            <div className="w-[80px] shrink-0" /> {/* Time column space */}
                            <div className="flex-1 grid grid-cols-7">
                                {weekDates.map((date, i) => {
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                        <div key={i} className="flex flex-col items-center">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest mb-1",
                                                isToday ? "text-primary" : "text-muted-foreground/60"
                                            )}>
                                                {WEEKDAYS[i]}
                                            </span>
                                            <span className={cn(
                                                "w-9 h-9 flex items-center justify-center text-lg font-bold rounded-full transition-colors",
                                                isToday ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-[#121212]"
                                            )}>
                                                {date.getDate()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TIME GRID AREA */}
                        <div className="relative flex-1 flex">
                            {/* TIME LABELS */}
                            <div className="w-[80px] shrink-0 border-r border-border/30 pt-[40px]">
                                {HOURS.map(hour => (
                                    <div key={hour} className="h-[80px] relative">
                                        <span className="absolute -top-2 right-4 text-[11px] font-bold text-muted-foreground/50">
                                            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* GRID COLUMNS */}
                            <div className="flex-1 grid grid-cols-7 relative">
                                {weekDates.map((date, colIndex) => {
                                    // Combine real tasks with some high-fidelity sample events if no tasks exist
                                    const realTasks = tasks.filter(t => new Date(t.date).toDateString() === date.toDateString());

                                    const displayTasks = realTasks.length > 0 ? realTasks : [
                                        // Sample events for demonstration
                                        { id: `s1-${colIndex}`, title: 'Strategic Planning', date: new Date(new Date(date).setHours(9, 0)), duration: 90, category: 'MEETING' },
                                        { id: `s2-${colIndex}`, title: 'Product Dev', date: new Date(new Date(date).setHours(11, 30)), duration: 120, category: 'DELIVERABLE' },
                                        { id: `s3-${colIndex}`, title: 'Client Sync', date: new Date(new Date(date).setHours(15, 0)), duration: 45, category: 'CLIENT' },
                                    ].filter(() => colIndex > 0 && colIndex < 6); // Only show samples on weekdays

                                    return (
                                        <div key={colIndex} className="relative border-r border-border/20 last:border-r-0 min-h-[960px]">
                                            {/* HOUR SEPARATORS */}
                                            {HOURS.map(hour => (
                                                <div key={hour} className="h-[80px] border-b border-border/20" />
                                            ))}

                                            {/* EVENT CARDS */}
                                            <AnimatePresence>
                                                {displayTasks.map(task => {
                                                    const styles = getEventStyles(new Date(task.date), (task as any).duration || 60);
                                                    const colorConfig = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.DEFAULT;

                                                    return (
                                                        <motion.div
                                                            key={task.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            whileHover={{ scale: 1.02, zIndex: 30, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                                            className={cn(
                                                                "absolute left-2 right-2 rounded-xl p-3 border-l-[4px] cursor-pointer group transition-all",
                                                                colorConfig.bg,
                                                                colorConfig.text.replace('text', 'border'),
                                                                `top-[${styles.top}] h-[${styles.height}]`
                                                            )}
                                                        >
                                                            <div className="flex flex-col h-full overflow-hidden" style={{ borderLeftColor: colorConfig.accent.replace('bg-', '') } as React.CSSProperties}>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold uppercase opacity-60 tracking-tight">
                                                                        {new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                    </span>
                                                                    <MoreHorizontal size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                                <h4 className="text-xs font-bold leading-tight mb-1 line-clamp-2">
                                                                    {task.title}
                                                                </h4>
                                                                {(task as any).duration >= 45 && (
                                                                    <p className="text-[10px] opacity-70 line-clamp-1 italic">
                                                                        {(task as any).notes || 'Scheduled via Designers OS'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* DRAG HANDLE SIMULATION */}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-ns-resize" />
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}

                                {/* CURRENT TIME INDICATOR */}
                                {new Date().getHours() >= 8 && new Date().getHours() < 20 && (
                                    <div
                                        className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                                        style={{ '--time-top': `${(new Date().getHours() - 8) * 80 + (new Date().getMinutes() / 60) * 80}px`, top: 'var(--time-top)' } as React.CSSProperties}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary -ml-[5px]" />
                                        <div className="h-[1.5px] w-full bg-primary/40" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
