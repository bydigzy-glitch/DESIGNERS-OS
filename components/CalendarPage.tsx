
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project } from '../types';
import {
    Clock,
    Calendar as CalendarIcon,
    AlertTriangle,
    Shield,
    ChevronLeft,
    ChevronRight,
    Plus,
    Flame,
    Coffee,
    Zap,
    LayoutGrid,
    List,
    Trello,
    Trash2,
    CheckCircle2,
    Circle,
    Filter,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { TaskModal } from './modals/TaskModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { HorizonCalendar } from './HorizonCalendar';

interface CalendarPageProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onAddTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
}

const MAX_HEALTHY_HOURS = 45;
const BURNOUT_THRESHOLD = 50;

const STATUS_COLUMNS = [
    { id: 'TODO', label: 'To Do', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'REVIEW', label: 'Review', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'DONE', label: 'Completed', color: 'text-green-500', bg: 'bg-green-500/10' },
];

export const CalendarPage: React.FC<CalendarPageProps> = ({
    tasks,
    projects,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
}) => {
    const [view, setView] = useState<'CALENDAR' | 'KANBAN' | 'HORIZON'>('HORIZON');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Calculate weekly hours & stats
    const weeklyStats = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.date);
            return taskDate >= startOfWeek && taskDate < endOfWeek && !t.completed;
        });

        const totalMinutes = weekTasks.reduce((sum, t) => sum + (t.duration || 60), 0);
        const totalHours = Math.round(totalMinutes / 60);
        const meetings = weekTasks.filter(t => t.category === 'MEETING').length;

        const sorted = [...weekTasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let backToBack = 0;
        for (let i = 1; i < sorted.length; i++) {
            const prevEnd = new Date(sorted[i - 1].date).getTime() + (sorted[i - 1].duration || 60) * 60000;
            const currStart = new Date(sorted[i].date).getTime();
            if (currStart - prevEnd < 15 * 60000) backToBack++;
        }

        const burnoutRisk = totalHours >= BURNOUT_THRESHOLD ? 'HIGH' : totalHours >= MAX_HEALTHY_HOURS ? 'MEDIUM' : 'LOW';

        return { totalHours, meetings, backToBack, burnoutRisk, weekTasks };
    }, [tasks, currentDate]);

    // Calendar logic
    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return [];
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        return tasks
            .filter(t => {
                const taskDate = new Date(t.date);
                return taskDate >= dayStart && taskDate < dayEnd;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [tasks, selectedDate]);

    // Kanban logic
    const kanbanTasks = useMemo(() => {
        const groups: Record<string, Task[]> = {
            TODO: [],
            IN_PROGRESS: [],
            REVIEW: [],
            DONE: [],
        };
        tasks.forEach(t => {
            const status = t.statusLabel || (t.completed ? 'DONE' : 'TODO');
            if (groups[status]) groups[status].push(t);
        });
        return groups;
    }, [tasks]);

    const getBurnoutColor = (risk: string) => {
        if (risk === 'HIGH') return 'text-red-500 bg-red-500/10';
        if (risk === 'MEDIUM') return 'text-orange-500 bg-orange-500/10';
        return 'text-green-500 bg-green-500/10';
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const handleAiOptimize = (dayTasks: Task[]) => {
        const taskList = dayTasks.map(t => `- ${t.title} (${t.duration}m)`).join('\n');
        const event = new CustomEvent('ai-action', {
            detail: {
                tool: 'optimize_schedule',
                prompt: `Analyze my current schedule for the week. Here are my tasks:\n\n${taskList}\n\nPlease identify any clusters where I might burn out and suggest a more balanced distribution of work. Output a polished strategy.`,
                content: 'Optimizing your horizon...'
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">
            {/* Header */}
            <FadeIn>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-h1 tracking-tight">Calendar</h1>
                        <p className="text-caption text-muted-foreground mt-1">Plan your speed, visualize your work</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-secondary rounded-xl border border-border/50">
                            <Button
                                variant={view === 'HORIZON' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('HORIZON')}
                                className="gap-2 text-[10px] font-bold h-8 px-4"
                            >
                                <Sparkles size={14} /> Horizon
                            </Button>
                            <Button
                                variant={view === 'CALENDAR' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('CALENDAR')}
                                className="gap-2 text-[10px] font-bold h-8 px-4"
                            >
                                <CalendarIcon size={14} /> Classic
                            </Button>
                            <Button
                                variant={view === 'KANBAN' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('KANBAN')}
                                className="gap-2 text-[10px] font-bold h-8 px-4"
                            >
                                <Trello size={14} /> Boards
                            </Button>
                        </div>
                        <Button onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="gap-2 shadow-lg h-10 px-6 rounded-xl">
                            <Plus size={16} /> Block Time
                        </Button>
                    </div>
                </div>
            </FadeIn>

            {/* Stats / Navigator */}
            <FadeIn delay={0.1}>
                <Card className={weeklyStats.burnoutRisk === 'HIGH' ? 'border-red-500/50' : weeklyStats.burnoutRisk === 'MEDIUM' ? 'border-orange-500/30' : 'bg-card/50'}>
                    <CardContent className="py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-xl border border-border">
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} className="h-8 w-8">
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <span className="text-overline min-w-[120px] text-center">
                                        Week of {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} className="h-8 w-8">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>

                                <div className="hidden sm:block w-48">
                                    <div className="flex justify-between text-overline mb-1">
                                        <span className="text-muted-foreground">Load</span>
                                        <span className={weeklyStats.totalHours > MAX_HEALTHY_HOURS ? 'text-red-500' : 'text-primary'}>
                                            {weeklyStats.totalHours}h / {MAX_HEALTHY_HOURS}h
                                        </span>
                                    </div>
                                    <Progress value={Math.min(100, (weeklyStats.totalHours / BURNOUT_THRESHOLD) * 100)} className="h-1.5" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-500 border border-blue-500/10">
                                    <CalendarIcon size={14} />
                                    <span className="text-xs font-bold">{weeklyStats.meetings} Meetings</span>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg ${getBurnoutColor(weeklyStats.burnoutRisk)} border border-current/10`}>
                                    {weeklyStats.burnoutRisk === 'HIGH' ? <Flame size={14} /> : weeklyStats.burnoutRisk === 'MEDIUM' ? <AlertTriangle size={14} /> : <Shield size={14} />}
                                    <span className="text-overline">
                                        {weeklyStats.burnoutRisk === 'HIGH' ? 'Burnout Risk' : weeklyStats.burnoutRisk === 'MEDIUM' ? 'Heavy Load' : 'Healthy Load'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </FadeIn>

            <AnimatePresence mode="wait">
                {view === 'HORIZON' ? (
                    <motion.div
                        key="horizon"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="h-[calc(100vh-320px)] min-h-[600px]"
                    >
                        <HorizonCalendar
                            tasks={tasks}
                            projects={projects}
                            onUpdateTask={onUpdateTask}
                            onAddTask={onAddTask}
                            onDeleteTask={onDeleteTask}
                            onOpenAiPlanner={handleAiOptimize}
                        />
                    </motion.div>
                ) : view === 'CALENDAR' ? (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* Interactive Calendar */}
                        <Card className="lg:col-span-1 border border-border shadow-soft overflow-hidden">
                            <CardHeader className="bg-secondary/20 pb-4 border-b border-border">
                                <CardTitle className="text-overline text-muted-foreground">Select Date</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <ShadcnCalendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="rounded-md"
                                    modifiers={{
                                        hasTasks: (date) => tasks.some(t => new Date(t.date).toDateString() === date.toDateString())
                                    }}
                                    modifiersStyles={{
                                        hasTasks: { fontWeight: 'bold', borderBottom: '2px solid var(--primary)', borderRadius: '0' }
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Day Schedule with Colour-Coded Cards */}
                        <Card className="lg:col-span-2 border border-border shadow-soft flex flex-col min-h-[500px]">
                            <CardHeader className="bg-secondary/20 pb-4 border-b border-border flex flex-row items-center justify-between">
                                <CardTitle className="text-h3">
                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </CardTitle>
                                <Badge variant="secondary" className="text-overline">{selectedDateTasks.length} Blocks</Badge>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4">
                                {selectedDateTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                        <Coffee size={48} strokeWidth={1} className="mb-4" />
                                        <p className="text-sm font-medium">Clear schedule for this day</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedDateTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                                                className="group relative flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 border border-transparent hover:border-primary/20 hover:bg-secondary/40 transition-all cursor-pointer overflow-hidden"
                                            >
                                                {/* Colour accent strip */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-1.5 opacity-60"
                                                    style={{ backgroundColor: task.color || 'var(--primary)' }}
                                                />
                                                <div className="flex flex-col items-center min-w-[60px] pt-1">
                                                    <span className="text-body-emphasis">
                                                        {new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    </span>
                                                    <span className="text-overline text-muted-foreground">{task.duration}m</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-bold transition-all ${task.completed ? 'line-through text-muted-foreground opacity-50' : 'text-foreground'}`}>
                                                            {task.title}
                                                        </h4>
                                                        {task.priority === 'HIGH' && <Badge variant="destructive" className="text-[9px] h-4">CRITICAL</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] bg-background/50">{task.category}</Badge>
                                                        {task.projectId && <span className="text-[10px] text-muted-foreground font-medium">Sync: {projects.find(p => p.id === task.projectId)?.title}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="kanban"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[600px]"
                    >
                        {STATUS_COLUMNS.map(column => (
                            <div key={column.id} className="flex flex-col h-full bg-secondary/10 rounded-2xl border border-border overflow-hidden">
                                <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${column.color.replace('text', 'bg')}`} />
                                        <span className="text-overline">{column.label}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-overline px-1.5">{kanbanTasks[column.id]?.length || 0}</Badge>
                                </div>
                                <ScrollArea className="flex-1 p-3">
                                    <div className="space-y-3">
                                        {kanbanTasks[column.id].map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                                                className="p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group relative overflow-hidden"
                                            >
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-1 opacity-40"
                                                    style={{ backgroundColor: task.color || 'var(--primary)' }}
                                                />
                                                <div className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{task.title}</div>
                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={10} className="text-muted-foreground" />
                                                        <span className="text-[10px] font-bold text-muted-foreground">
                                                            {new Date(task.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[8px] uppercase">{task.category}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {kanbanTasks[column.id].length === 0 && (
                                            <div className="py-20 text-center text-muted-foreground opacity-30">
                                                <CheckCircle2 size={32} strokeWidth={1} className="mx-auto mb-2" />
                                                <p className="text-[10px] font-bold uppercase">Empty Column</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task Modal */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onSave={(t) => {
                    if (selectedTask) onUpdateTask({ ...selectedTask, ...t });
                    else onAddTask({
                        id: Date.now().toString(),
                        date: selectedDate || new Date(),
                        duration: 60,
                        completed: false,
                        statusLabel: 'TODO',
                        ...t
                    } as Task);
                }}
                onDelete={onDeleteTask}
                initialTask={selectedTask}
                projects={projects}
            />
        </div>
    );
};
