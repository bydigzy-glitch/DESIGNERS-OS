
import React, { useState, useMemo, useEffect } from 'react';
import { Task, ViewMode, Client, Project, User, Habit } from '../types';
import { Zap, Plus, CheckCircle2, Briefcase, Sparkles, Flame, CheckSquare, Calendar, Trash2, ArrowUpRight, TrendingUp, MoreHorizontal, FileText, MessageSquare, Clock, AlertTriangle, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BorderBeam } from "@/components/magicui/border-beam";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from './common/EmptyState';
import { ProjectModal } from './modals/ProjectModal';
import { TaskModal } from './modals/TaskModal';
import { TasksTable } from './common/TasksTable';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface HQProps {
    user: User | null;
    tasks: Task[];
    clients: Client[];
    projects: Project[];
    habits: Habit[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;

    onStartRecovery: (energy: number) => void;
    onNavigate: (view: ViewMode) => void;
    onSendMessage?: (text: string, image?: string) => void;
    onOpenAiSidebar: () => void;

    onAddTask: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;

    onAddProject: (project: Project) => void;
    onUpdateProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;

    onToggleHabit: (id: string) => void;
}

const WorkProgressGraph: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    // Generate last 7 days
    const days = useMemo(() => {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            result.push(d);
        }
        return result;
    }, []);

    // Calculate completed tasks per day
    const dataPoints = useMemo(() => {
        return days.map(day => {
            const dayStr = day.toISOString().split('T')[0];
            return tasks.filter(t =>
                t.completed &&
                new Date(t.date).toISOString().split('T')[0] === dayStr
            ).length;
        });
    }, [tasks, days]);

    const width = 100;
    const height = 50;

    // Create SVG Path
    const createPath = (data: number[]) => {
        if (data.length === 0) return "";
        const stepX = width / (data.length - 1);
        const maxVal = Math.max(...data, 5); // Minimum scale of 5
        const minVal = 0;

        const getY = (val: number) => height - ((val - minVal) / (maxVal - minVal)) * height;

        let d = `M 0 ${getY(data[0])} `;
        for (let i = 1; i < data.length; i++) {
            const x = i * stepX;
            const y = getY(data[i]);
            const prevX = (i - 1) * stepX;
            const prevY = getY(data[i - 1]);
            const cp1x = prevX + (stepX / 2);
            const cp1y = prevY;
            const cp2x = x - (stepX / 2);
            const cp2y = y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
        }
        return d;
    };

    const totalThisWeek = dataPoints.reduce((a, b) => a + b, 0);

    return (
        <div className="w-full h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-base font-bold text-foreground">Work Progress</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                            <CountUp value={totalThisWeek} duration={1} />
                        </span>
                        <span className="text-xs text-muted-foreground">tasks done this week</span>
                    </div>
                </div>
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <TrendingUp size={18} />
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <svg viewBox={`0 0 ${width} ${height} `} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={`${createPath(dataPoints)} L ${width} ${height} L 0 ${height} Z`} fill="url(#gradient)" className="animate-pulse" />
                    <path d={createPath(dataPoints)} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>

            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase mt-4">
                {days.map(d => <div key={d.toString()}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>)}
            </div>
        </div>
    );
};

export const HQ: React.FC<HQProps> = ({
    user, tasks, clients, projects, habits, onNavigate, onSendMessage, onOpenAiSidebar,
    onAddTask, onUpdateTask, onDeleteTask,
    onAddProject, onUpdateProject, onDeleteProject,
    onToggleHabit
}) => {
    const [aiInput, setAiInput] = useState('');

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const activeProjects = projects.filter(p => p.status === 'ACTIVE').slice(0, 3);
    const pendingTasks = tasks.filter(t => !t.completed);

    const totalStreak = useMemo(() => {
        return habits.reduce((acc, h) => acc + h.streak, 0);
    }, [habits]);

    // Priority Logic
    const overdueTasks = tasks.filter(t => !t.completed && new Date(t.date) < new Date());
    const highPriorityTasks = tasks.filter(t => !t.completed && t.priority === 'HIGH');

    // Revised Upcoming Tasks Logic (Next 5 future tasks sorted by date)
    const upcomingTasks = tasks
        .filter(t => !t.completed && new Date(t.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    const focusTasks = [...overdueTasks, ...highPriorityTasks].slice(0, 5);

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (aiInput.trim() && onSendMessage) {
            onSendMessage(aiInput);
            onOpenAiSidebar(); // Open overlay instead of navigating
            setAiInput('');
        }
    };

    // Habits Logic for Card
    const today = new Date().toISOString().split('T')[0];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
    const todaysPendingHabits = habits.filter(h => !h.completedDates.includes(today));

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full space-y-6 md:space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2 relative">

                {/* Top Right Ignite Button */}
                <div className="absolute top-0 right-0 z-20">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={onOpenAiSidebar}
                                variant="outline"
                                className="relative overflow-hidden flex items-center gap-2 shadow-glow border-primary/20 hover:border-primary/50 group bg-background/50 backdrop-blur-sm"
                            >
                                <Flame size={16} fill="currentColor" className="text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-primary">Ignite</span>
                                <BorderBeam
                                    size={40}
                                    duration={3}
                                    colorFrom="hsl(var(--primary))"
                                    colorTo="hsl(var(--primary) / 0)"
                                    className="opacity-70"
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Open AI assistant</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Header & Greeting */}
                <FadeIn>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-10 md:pt-0">
                        <div className="flex flex-col gap-4 max-w-lg w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                    <TextAnimate
                                        animation="blurInUp"
                                        by="character"
                                        once
                                        text={`Hey, ${user?.name?.split(' ')[0] || 'Creator'}`}
                                    />
                                </h1>
                                <p className="text-muted-foreground">Ready to conquer the day?</p>
                            </div>
                            <form onSubmit={handleAiSubmit} className="relative w-full group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <MessageSquare size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="Ask Ignite to add tasks or review projects..."
                                    className="w-full h-12 bg-secondary rounded-xl pl-10 pr-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground text-sm font-medium border border-border"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button type="submit" className="p-1.5 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors">
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </FadeIn>

                {/* Top Row Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Work Progress Graph (Span 6) */}
                    <FadeIn delay={0.1} className="md:col-span-6 lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[200px]">
                        <WorkProgressGraph tasks={tasks} />
                    </FadeIn>

                    {/* Right Column Stack (Span 6) */}
                    <div className="md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-6">

                        {/* Habits Card - UPDATED DESIGN */}
                        <FadeIn delay={0.2} className="col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between group hover:border-primary/30 transition-colors relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                        <Flame size={20} fill="currentColor" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-muted-foreground block">STREAK</span>
                                        <span className="text-xl font-bold text-foreground leading-none"><CountUp value={totalStreak} /> Days</span>
                                    </div>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => onNavigate('HABITS')} className="h-8 w-8">
                                            <ArrowUpRight size={16} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>View all habits</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Heatmap */}
                            <div className="flex justify-between gap-1 mb-4">
                                {last7Days.map(date => {
                                    const isToday = date === today;
                                    const completedCount = habits.filter(h => h.completedDates.includes(date)).length;
                                    const totalHabits = habits.length || 1;
                                    const intensity = completedCount / totalHabits;

                                    // Determine color class based on activity
                                    let bgClass = 'bg-secondary/50';
                                    if (completedCount > 0) {
                                        if (intensity >= 1) bgClass = 'bg-primary';
                                        else if (intensity >= 0.5) bgClass = 'bg-primary/70';
                                        else bgClass = 'bg-primary/40';
                                    }

                                    return (
                                        <div key={date} className="flex flex-col items-center gap-1 flex-1">
                                            <div className={`w - full aspect - square rounded - md transition - all ${bgClass} ${isToday ? 'ring-2 ring-primary/20' : ''} `} title={`${completedCount} habits on ${date} `} />
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Quick Check-in */}
                            <div className="space-y-2">
                                {todaysPendingHabits.slice(0, 2).map(h => (
                                    <div key={h.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-transparent hover:border-primary/30 transition-colors group/item">
                                        <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{h.title}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); onToggleHabit(h.id) }}
                                            className="h-5 w-5"
                                        >
                                            <Check size={12} />
                                        </Button>
                                    </div>
                                ))}
                                {todaysPendingHabits.length === 0 && habits.length > 0 && (
                                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold text-center flex items-center justify-center gap-2">
                                        <CheckCircle2 size={12} /> All Done for Today!
                                    </div>
                                )}
                                {habits.length === 0 && (
                                    <div className="text-xs text-muted-foreground text-center">No habits tracked. Add one!</div>
                                )}
                            </div>
                        </FadeIn>

                        {/* Focus Zone Card */}
                        <FadeIn delay={0.3} className="col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col cursor-pointer hover:border-red-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">FOCUS ZONE</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 mt-2 max-h-[100px] scrollbar-hide">
                                {focusTasks.length > 0 ? focusTasks.map(t => (
                                    <div key={t.id} onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }} className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary transition-colors">
                                        <span className={`w - 2 h - 2 rounded - full ${new Date(t.date) < new Date() ? 'bg-red-500' : 'bg-primary'} `}></span>
                                        <span className="truncate">{t.title}</span>
                                    </div>
                                )) : (
                                    <div className="text-xs text-muted-foreground">Nothing urgent. Great job!</div>
                                )}
                            </div>
                        </FadeIn>
                    </div>
                </div>

                {/* Middle Row: Active Projects, Upcoming Tasks, Recent Clients */}
                <FadeIn delay={0.4} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Active Projects Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">Active Projects</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedProject(null); setIsProjectModalOpen(true); }} className="h-8 w-8">
                                        <Plus size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add new project</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="space-y-4 flex-1">
                            {activeProjects.length > 0 ? activeProjects.map(p => (
                                <div key={p.id} onClick={(e) => { e.stopPropagation(); setSelectedProject(p); setIsProjectModalOpen(true); }} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm" style={{ backgroundColor: `${p.color} 20`, color: p.color }}>
                                        {p.title.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-sm font-bold text-foreground truncate">{p.title}</div>
                                            <div className="text-xs font-medium text-muted-foreground">{p.progress}%</div>
                                        </div>
                                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.progress}% `, backgroundColor: p.color }}></div>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No active projects</div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Tasks Card - NEW */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">Upcoming</h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => onNavigate('CALENDAR')} className="h-8 w-8">
                                        <Calendar size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>View calendar</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] scrollbar-hide">
                            {upcomingTasks.length > 0 ? upcomingTasks.map(t => (
                                <div key={t.id} onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border group">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary flex flex-col items-center justify-center text-xs font-bold border border-border">
                                        <span className="text-muted-foreground uppercase text-[8px]">{new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-foreground">{new Date(t.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-foreground truncate">{t.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No upcoming tasks</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Clients Card */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">Recent Clients</h3>
                            <Button variant="link" onClick={() => onNavigate('MANAGER')} className="text-xs font-bold p-0 h-auto">View All</Button>
                        </div>

                        <div className="space-y-4 flex-1">
                            {clients.slice(0, 4).map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-foreground border border-border">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">{c.name}</div>
                                            <div className="text-xs text-muted-foreground">{c.status}</div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-mono font-bold text-foreground">
                                        {/* Calculate dynamic total spent for dashboard preview if desired, or assume revenue is updated */}
                                        $<CountUp value={projects.filter(p => p.clientId === c.id).reduce((s, p) => s + (p.price || 0), 0)} />
                                    </div>
                                </div>
                            ))}
                            {clients.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm">No clients found</div>
                            )}
                        </div>
                    </div>
                </FadeIn>

                {/* Bottom Row: Tasks Table */}
                <FadeIn delay={0.5}>
                    <TasksTable
                        tasks={tasks}
                        projects={projects}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onAddTask={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                        onSelectTask={(task) => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                    />
                </FadeIn>

                {/* MODALS */}
                <ProjectModal
                    isOpen={isProjectModalOpen}
                    onClose={() => setIsProjectModalOpen(false)}
                    onSave={(p) => {
                        if (selectedProject) onUpdateProject({ ...selectedProject, ...p });
                        else onAddProject({ id: Date.now().toString(), tags: [], progress: 0, ...p } as Project);
                    }}
                    onDelete={onDeleteProject}
                    initialProject={selectedProject}
                    allTasks={tasks}
                    clients={clients}
                    onLinkTasks={(taskIds, projectId) => { }}
                />

                <TaskModal
                    isOpen={isTaskModalOpen}
                    onClose={() => setIsTaskModalOpen(false)}
                    onSave={(t) => {
                        if (selectedTask) onUpdateTask({ ...selectedTask, ...t });
                        else onAddTask({ id: Date.now().toString(), date: new Date(), duration: 60, completed: false, ...t } as Task);
                    }}
                    onDelete={onDeleteTask}
                    initialTask={selectedTask}
                    projects={projects}
                />
            </div>
        </TooltipProvider>
    );
};