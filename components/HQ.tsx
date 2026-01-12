
import React, { useState, useMemo, useEffect } from 'react';
import { Task, ViewMode, Client, Project, User, Habit, ApprovalRequest, RiskAlert, HandledAction } from '../types';
import {
    Zap, Plus, CheckCircle2, Briefcase, Sparkles, Flame, CheckSquare,
    Calendar, Trash2, ArrowUpRight, TrendingUp, MoreHorizontal,
    FileText, MessageSquare, Clock, AlertTriangle, Star, Check,
    AlertCircle, Shield, X, ChevronRight, Brain, LayoutGrid, Box
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
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
    pendingApprovals: ApprovalRequest[];
    riskAlerts: RiskAlert[];
    handledToday: HandledAction[];
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
    onApprove: (approval: ApprovalRequest) => void;
    onReject: (approval: ApprovalRequest) => void;
    onAcknowledgeRisk: (alert: RiskAlert) => void;
}

const WorkProgressGraph: React.FC<{ tasks: Task[], projects: Project[] }> = ({ tasks, projects }) => {
    const data = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;

        return last7Days.map(date => ({
            date,
            workDone: tasks.filter(t => {
                if (!t.completed || !t.date) return false;
                try {
                    return new Date(t.date).toISOString().split('T')[0] === date;
                } catch (e) {
                    return false;
                }
            }).length,
            projectLoad: activeProjectsCount
        }));
    }, [tasks, projects]);

    const maxWork = Math.max(...data.map(d => d.workDone), 1);
    const maxProject = Math.max(...data.map(d => d.projectLoad), 1);
    const globalMax = Math.max(maxWork, maxProject, 5); // Minimum scale of 5

    const totalCompleted = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
    const totalActiveProjects = projects.filter(p => p.status === 'ACTIVE').length;

    return (
        <div className="w-full h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-8">
                    <div>
                        <h3 className="text-h3">Work Progress</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-h1 text-primary tracking-tighter">
                                <CountUp value={totalCompleted} />
                            </span>
                            <span className="text-overline text-muted-foreground">tasks completed</span>
                        </div>
                    </div>
                    <div className="hidden sm:block border-l border-border pl-8">
                        <h3 className="text-overline text-muted-foreground mb-1">Active Projects</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-h2 text-purple-500 tracking-tighter">
                                <CountUp value={totalActiveProjects} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.1)]">
                    <TrendingUp size={22} />
                </div>
            </div>

            <div className="flex-1 flex items-end gap-3 px-1 min-h-[140px]">
                {data.map((d, i) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-3 group relative">
                        <div className="w-full relative flex items-end justify-center gap-1 h-full max-h-[120px]">
                            {/* Project Load - Background or side bar */}
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: `${(d.projectLoad / globalMax) * 100}%`, opacity: 0.15 }}
                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                className="w-full max-w-[12px] rounded-none bg-purple-500"
                            />

                            {/* Work Done - Main bar */}
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: `${Math.max((d.workDone / globalMax) * 100, 2)}%`, opacity: 1 }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className={`w-full max-w-[20px] rounded-none transition-all relative ${d.workDone > 0
                                    ? 'bg-gradient-to-t from-primary/40 to-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]'
                                    : 'bg-secondary/20'}`}
                            />

                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 min-w-[100px]">
                                <p className="text-[10px] text-muted-foreground mb-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-[10px] font-bold text-primary">Work Done:</span>
                                    <span className="text-[10px] font-bold">{d.workDone}</span>
                                </div>
                                <div className="flex justify-between items-center gap-4">
                                    <span className="text-[10px] font-bold text-purple-500">Projects:</span>
                                    <span className="text-[10px] font-bold">{d.projectLoad}</span>
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest group-hover:text-primary transition-colors">
                            {new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-none bg-primary" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Work Done</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-none bg-purple-500/40" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Project Load</span>
                </div>
            </div>
        </div>
    );
};

const URGENCY_COLORS = {
    LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    MEDIUM: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    HIGH: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const SEVERITY_COLORS = {
    INFO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    WARNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const SEVERITY_ICONS = {
    INFO: <AlertCircle size={16} />,
    WARNING: <AlertTriangle size={16} />,
    CRITICAL: <Flame size={16} />,
};

export const HQ: React.FC<HQProps> = ({
    user, tasks, clients, projects, habits,
    pendingApprovals, riskAlerts, handledToday,
    onNavigate, onSendMessage, onOpenAiSidebar,
    onAddTask, onUpdateTask, onDeleteTask,
    onAddProject, onUpdateProject, onDeleteProject,
    onToggleHabit, onApprove, onReject, onAcknowledgeRisk
}) => {
    const [aiInput, setAiInput] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Set loaded state after component mounts
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const activeProjects = projects.filter(p => p.status === 'ACTIVE').slice(0, 3);
    const pendingTasks = tasks.filter(t => !t.completed);

    const totalStreak = useMemo(() => {
        return habits.reduce((acc, h) => acc + h.streak, 0);
    }, [habits]);

    // Memoize greeting text to prevent re-renders
    const greetingText = useMemo(() => {
        return `Hey, ${user?.name?.split(' ')[0] || 'Creator'}`;
    }, [user?.name]);

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

    // Calculate Today's Focus - most urgent items
    const todaysFocus = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Get overdue tasks
        const overdueTasks = tasks.filter(t =>
            !t.completed && new Date(t.date) < now
        ).map(t => ({ type: 'OVERDUE' as const, task: t, priority: 100 }));

        // Get pending approvals as focus items
        const approvalFocus = pendingApprovals
            .slice(0, 1)
            .map(a => ({ type: 'APPROVAL' as const, approval: a, priority: 90 }));

        // Get critical risks as focus items
        const criticalRisks = riskAlerts
            .filter(r => r.severity === 'CRITICAL' && !r.acknowledged)
            .slice(0, 1)
            .map(r => ({ type: 'RISK' as const, risk: r, priority: 95 }));

        return [...overdueTasks, ...approvalFocus, ...criticalRisks]
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5);
    }, [tasks, pendingApprovals, riskAlerts]);

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
            <div className="flex flex-col h-full w-full space-y-6 md:space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2 relative z-[var(--z-container)]">


                {/* Header & Greeting */}
                <FadeIn>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                        <div className="flex flex-col gap-4 max-w-lg w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight h-[36px]">
                                    {isLoaded ? (
                                        <TextAnimate
                                            key={greetingText}
                                            animation="blurInUp"
                                            by="character"
                                            once
                                            startOnView={false}
                                            text={greetingText}
                                        />
                                    ) : (
                                        <Skeleton className="h-8 w-48 bg-secondary/80" />
                                    )}
                                </h1>
                                <p className="text-muted-foreground">
                                    {isLoaded ? "Ready to conquer the day?" : <Skeleton className="h-4 w-32 mt-2" />}
                                </p>
                            </div>
                            <form onSubmit={handleAiSubmit} className="relative w-full group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <MessageSquare size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder="Ask Assist to add tasks or review projects..."
                                    className="w-full h-12 bg-secondary rounded-xl pl-10 pr-12 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground text-sm font-medium border border-border"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button type="submit" className="p-1.5 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors" title="Send Prompt">
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </FadeIn>

                {/* Top Row Stats */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    <FadeIn delay={0.1} className="md:col-span-6 lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[220px]">
                        {!isLoaded ? (
                            <div className="w-full h-full flex flex-col gap-4">
                                <Skeleton className="h-8 w-32" />
                                <Skeleton className="flex-1 w-full" />
                            </div>
                        ) : (
                            <WorkProgressGraph tasks={tasks} projects={projects} />
                        )}
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
                                            <div className={`w-full aspect-square rounded-md transition-all ${bgClass} ${isToday ? 'ring-2 ring-primary/20' : ''}`} title={`${completedCount} habits on ${date}`} />
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

                        {/* Intelligence Focus Card */}
                        <FadeIn delay={0.3} className="col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:border-primary/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <Brain size={20} />
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Intelligence Focus</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 mt-2 scrollbar-hide">
                                {todaysFocus.length > 0 ? todaysFocus.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group/focus">
                                        {item.type === 'APPROVAL' && (
                                            <div className="w-8 h-8 rounded-none bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                                                <Star size={14} />
                                            </div>
                                        )}
                                        {item.type === 'RISK' && (
                                            <div className="w-8 h-8 rounded-none bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                                                <Flame size={14} />
                                            </div>
                                        )}
                                        {item.type === 'OVERDUE' && (
                                            <div className="w-8 h-8 rounded-none bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                                                <Clock size={14} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">
                                                {item.type === 'APPROVAL' ? item.approval?.title :
                                                    item.type === 'RISK' ? item.risk?.title :
                                                        item.task?.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {item.type === 'APPROVAL' ? 'Needs Review' :
                                                    item.type === 'RISK' ? 'Critical Risk' :
                                                        'Past Due'}
                                            </p>
                                        </div>
                                        <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover/focus:opacity-100 transition-opacity" />
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                        <CheckCircle2 size={24} className="text-green-500 mb-2 opacity-50" />
                                        <p className="text-[10px] text-muted-foreground font-medium">All systems clear.<br />You're ahead of the curve.</p>
                                    </div>
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
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm bg-secondary text-foreground">
                                        {p.title.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-sm font-bold text-foreground truncate">{p.title}</div>
                                            <div className="text-xs font-medium text-muted-foreground">{p.progress}%</div>
                                        </div>
                                        <div className="w-full h-1.5 bg-secondary rounded-none overflow-hidden">
                                            <div className="h-full rounded-none transition-all duration-500 bg-primary" style={{ width: `${p.progress}%` }}></div>
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
                                        <div className="w-10 h-10 rounded-none bg-secondary flex items-center justify-center font-bold text-sm text-foreground border border-border">
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