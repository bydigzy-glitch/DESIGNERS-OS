
import React, { useState, useMemo } from 'react';
import { Task, Project } from '../types';
import {
    Clock,
    MoreHorizontal,
    Plus,
    Sparkles,
    GripVertical,
    AlertCircle,
    CheckCircle2,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HorizonCalendarProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onOpenAiPlanner?: (dayTasks: Task[]) => void;
}

export const HorizonCalendar: React.FC<HorizonCalendarProps> = ({
    tasks,
    projects,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    onOpenAiPlanner
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);

    // Generate 7 days starting from current viewing date's week start
    const days = useMemo(() => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay() + 1); // Monday start
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const navigateDate = (dir: 'prev' | 'next') => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + (dir === 'next' ? 7 : -7));
        setCurrentDate(next);
    };

    const getTasksForDay = (date: Date) => {
        return tasks.filter(t => {
            const d = new Date(t.date);
            return d.getDate() === date.getDate() &&
                d.getMonth() === date.getMonth() &&
                d.getFullYear() === date.getFullYear();
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const getDayLoad = (dayTasks: Task[]) => {
        const totalMinutes = dayTasks.reduce((acc, t) => acc + (t.duration || 60), 0);
        return Math.min(100, (totalMinutes / 480) * 100); // 8h standard day
    };

    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const handleDrop = (date: Date) => {
        if (draggedTask) {
            const newTaskDate = new Date(date);
            const originalDate = new Date(draggedTask.date);
            newTaskDate.setHours(originalDate.getHours(), originalDate.getMinutes());

            onUpdateTask({
                ...draggedTask,
                date: newTaskDate
            });
            setDraggedTask(null);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background/50 rounded-3xl border border-border/50 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Intelligent Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-card/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <CalendarIcon className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">Focus Horizon</h2>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Intelligent Schedule</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border/50 mx-2" />

                    <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
                        <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8 rounded-lg hover:bg-background">
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-xs font-bold px-4 min-w-[140px] text-center">
                            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} className="h-8 w-8 rounded-lg hover:bg-background">
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl border border-border/40">
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7 px-3 rounded-lg bg-background shadow-sm border border-border/50">Weekly</Button>
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold h-7 px-3 rounded-lg text-muted-foreground">Monthly</Button>
                    </div>

                    <Button
                        onClick={() => onOpenAiPlanner?.(tasks)}
                        className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-none px-4"
                    >
                        <Sparkles size={14} />
                        <span className="text-xs font-bold">AI Optimize</span>
                    </Button>
                </div>
            </div>

            {/* Horizontal Timeline Kanban */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide flex">
                <div className="flex h-full min-w-full">
                    {days.map((day, idx) => {
                        const dayTasks = getTasksForDay(day);
                        const load = getDayLoad(dayTasks);
                        const isToday = new Date().toDateString() === day.toDateString();

                        return (
                            <div
                                key={day.toISOString()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(day)}
                                className={cn(
                                    "flex-1 min-w-[280px] border-r border-border/30 flex flex-col group/lane transition-all relative overflow-hidden",
                                    isToday ? "bg-primary/[0.02]" : ""
                                )}
                            >
                                {/* Heatmap Background */}
                                <div
                                    className="absolute inset-x-0 bottom-0 pointer-events-none transition-all duration-1000"
                                    style={{
                                        height: `${load}%`,
                                        background: `linear-gradient(to top, ${load > 80 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.05)'}, transparent)`
                                    }}
                                />

                                {/* Lane Header */}
                                <div className="p-5 border-b border-border/20 flex items-center justify-between bg-card/10 backdrop-blur-sm sticky top-0 z-20">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex flex-col items-center justify-center border shadow-sm transition-all",
                                            isToday
                                                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-primary/20"
                                                : "bg-secondary/80 border-border/50 text-foreground"
                                        )}>
                                            <span className="text-[10px] font-bold uppercase leading-none opacity-80">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                            <span className="text-sm font-black leading-none mt-0.5">{day.getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-foreground">
                                                    {isToday ? "Today" : day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-500", load > 80 ? "bg-red-500" : "bg-primary")}
                                                        style={{ width: `${load}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase">{Math.round(load / 100 * 8)}h</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/lane:opacity-100 transition-opacity">
                                        <Plus size={14} />
                                    </Button>
                                </div>

                                {/* Task Cards Area */}
                                <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide z-10 pb-20">
                                    <AnimatePresence mode="popLayout">
                                        {dayTasks.map((task) => (
                                            <motion.div
                                                key={task.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                draggable
                                                onDragStart={() => handleDragStart(task)}
                                                className="group/card relative"
                                            >
                                                <Card className={cn(
                                                    "group p-4 bg-card/60 backdrop-blur-md border border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden",
                                                    task.completed ? "opacity-60 grayscale-[0.5]" : ""
                                                )}>
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1.5 opacity-50 transition-all group-hover:w-2"
                                                        style={{ backgroundColor: task.color || 'var(--primary)' }}
                                                    />

                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-[10px] font-black text-muted-foreground/80 flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                                </span>
                                                                {task.priority === 'HIGH' && (
                                                                    <Badge className="bg-red-500/10 text-red-600 border-none text-[8px] h-3.5 font-black uppercase px-1.5">Focus</Badge>
                                                                )}
                                                            </div>
                                                            <h4 className={cn(
                                                                "text-sm font-bold leading-snug tracking-tight truncate group-hover:text-primary transition-colors",
                                                                task.completed && "line-through"
                                                            )}>
                                                                {task.title}
                                                            </h4>
                                                        </div>
                                                        <div className="flex flex-col gap-1 items-end">
                                                            <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                <Plus className="w-3 h-3 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[9px] h-4 bg-background/50 border-border/40 font-bold uppercase tracking-tighter">
                                                                {task.category}
                                                            </Badge>
                                                            {task.projectId && (
                                                                <span className="text-[9px] font-bold text-muted-foreground truncate max-w-[80px]">
                                                                    {projects.find(p => p.id === task.projectId)?.title}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Activity Pulse if active */}
                                                        {!task.completed && task.statusLabel === 'IN_PROGRESS' && (
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {dayTasks.length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-border/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground/30 group-hover/lane:border-primary/20 transition-colors">
                                            <AlertCircle size={24} strokeWidth={1} />
                                            <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter">Clear Channel</span>
                                        </div>
                                    )}

                                    {/* Action Footprint */}
                                    <div className="pt-2 opacity-0 group-hover/lane:opacity-100 transition-all transform translate-y-2 group-hover/lane:translate-y-0">
                                        <Button
                                            variant="ghost"
                                            className="w-full h-10 border border-dashed border-border/40 rounded-xl text-xs font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                        >
                                            Add Entry
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Intelligent Footer HUD */}
            <div className="h-16 border-t border-border/40 bg-card/40 flex items-center px-6 justify-between backdrop-blur-xl">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Synced</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {projects.slice(0, 3).map((p, i) => (
                                <div key={p.id} className="w-6 h-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                                    <span className="text-[8px] font-bold">{p.title[0]}</span>
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">Active Projects</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground">Horizon Density:</span>
                    <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${(tasks.filter(t => !t.completed).length / (tasks.length || 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
