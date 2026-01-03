
import React, { useState } from 'react';
import { Task, Project } from '../types';
import {
    Plus, GripVertical, Check, ChevronDown, ChevronUp,
    LayoutGrid, List, Clock, MessageSquare, Paperclip,
    Search, Filter, MoreHorizontal, Calendar,
    CheckCircle2, Circle, CheckSquare
} from 'lucide-react';
import { TaskModal } from './modals/TaskModal';
import { ProjectModal } from './modals/ProjectModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from './common/AnimatedComponents';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";

interface TasksPageProps {
    tasks: Task[];
    projects: Project[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: (task: Task) => void;
    onUpdateProject: (project: Project) => void;
    onAddProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
}

// Sub-component: PriorityBadge
const PriorityBadge = ({ priority }: { priority?: Task['priority'] | 'CRITICAL' }) => {
    const config: Record<string, { label: string, class: string }> = {
        CRITICAL: { label: 'Critical', class: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' },
        HIGH: { label: 'High', class: 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' },
        MEDIUM: { label: 'Medium', class: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' },
        LOW: { label: 'Low', class: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' },
    };

    if (!priority) return null;
    const { label, class: className } = config[priority] || config.MEDIUM;

    return (
        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0 border", className)}>
            {label}
        </Badge>
    );
};

// Sub-component: Facepile
const Facepile = ({ members = [] }: { members?: any[] }) => {
    // If no members, show a placeholder for the "Digzy" user
    const displayMembers = members.length > 0 ? members : [{ id: 'admin', name: 'Digzy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Digzy' }];

    return (
        <div className="flex -space-x-2 overflow-hidden">
            {displayMembers.slice(0, 3).map((m, i) => (
                <Avatar key={m.id || i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background border border-border shadow-sm">
                    <AvatarImage src={m.avatar} alt={m.name} />
                    <AvatarFallback className="text-[10px] bg-secondary">{m.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
            ))}
            {displayMembers.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-secondary text-[8px] font-bold text-muted-foreground border border-border">
                    +{displayMembers.length - 3}
                </div>
            )}
        </div>
    );
};

export const TasksPage: React.FC<TasksPageProps> = ({
    tasks, projects, onUpdateTask, onDeleteTask, onAddTask,
    onUpdateProject, onAddProject, onDeleteProject
}) => {
    const [activeView, setActiveView] = useState<'KANBAN' | 'LIST'>('KANBAN');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [modalDefaultStatus, setModalDefaultStatus] = useState<Task['statusLabel']>('TODO');

    const columnKeys: Task['statusLabel'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const columnColors: Record<string, string> = {
        TODO: 'bg-slate-400',
        IN_PROGRESS: 'bg-blue-500',
        REVIEW: 'bg-amber-500',
        DONE: 'bg-emerald-500'
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleAddTaskToColumn = (status: Task['statusLabel']) => {
        setSelectedTask(null);
        setModalDefaultStatus(status);
        setIsTaskModalOpen(true);
    };

    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const d = new Date(date);
        const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days`;
        if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full bg-background overflow-hidden">

                {/* 1. Header & View Switcher */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b border-border bg-card/30 backdrop-blur-md z-20 flex-shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Tasks</h1>
                        <p className="text-sm text-muted-foreground font-medium">Manage your production flow and project deadlines.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle Pill */}
                        <div className="flex items-center p-1 bg-secondary/50 rounded-full border border-border shadow-inner">
                            <button
                                onClick={() => setActiveView('KANBAN')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
                                    activeView === 'KANBAN'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <LayoutGrid size={14} />
                                Kanban
                            </button>
                            <button
                                onClick={() => setActiveView('LIST')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200",
                                    activeView === 'LIST'
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <List size={14} />
                                List
                            </button>
                        </div>

                        <Button
                            onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                            className="rounded-full font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95"
                        >
                            <Plus size={18} className="mr-1" />
                            New Task
                        </Button>
                    </div>
                </header>

                {/* 2. Content Area */}
                <main className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {activeView === 'KANBAN' ? (
                            <motion.div
                                key="kanban"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50/30 dark:bg-transparent"
                            >
                                <div className="flex gap-6 p-6 h-full min-w-max">
                                    {columnKeys.map(colId => {
                                        const colTasks = tasks.filter(t =>
                                            (t.statusLabel === colId) ||
                                            (colId === 'TODO' && !t.statusLabel && !t.completed)
                                        );

                                        return (
                                            <div
                                                key={colId}
                                                className="flex flex-col w-[320px] h-full"
                                            >
                                                {/* Column Header */}
                                                <div className="flex items-center justify-between mb-4 px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full shadow-sm", columnColors[colId || 'TODO'])} />
                                                        <h3 className="text-sm font-bold text-foreground">
                                                            {colId?.replace('_', ' ')}
                                                        </h3>
                                                        <Badge variant="secondary" className="bg-secondary/70 text-[10px] font-bold px-1.5 h-5 min-w-[20px] flex items-center justify-center rounded-md">
                                                            {colTasks.length}
                                                        </Badge>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddTaskToColumn(colId)}
                                                        className="p-1 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                {/* Task Cards Container */}
                                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20">
                                                    {colTasks.map(task => {
                                                        const project = projects.find(p => p.id === task.projectId);
                                                        return (
                                                            <motion.div
                                                                key={task.id}
                                                                layout
                                                                whileHover={{ scale: 1.01 }}
                                                                className="bg-card p-4 rounded-xl border border-border hover:border-primary/20 hover:shadow-md transition-all group cursor-pointer relative"
                                                                onClick={() => handleEditTask(task)}
                                                            >
                                                                <div className="flex flex-col gap-3">
                                                                    <div className="flex justify-between items-start">
                                                                        <PriorityBadge priority={task.priority} />
                                                                        <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary text-muted-foreground transition-all">
                                                                            <MoreHorizontal size={14} />
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <h4 className={cn(
                                                                            "text-sm font-bold leading-snug transition-colors group-hover:text-primary",
                                                                            task.completed && "line-through text-muted-foreground"
                                                                        )}>
                                                                            {task.title}
                                                                        </h4>
                                                                        {project && (
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/70">
                                                                                {project.title}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Metadata & Facepile */}
                                                                    <div className="pt-2 flex items-center justify-between border-t border-border/50">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                                                                <Clock size={12} />
                                                                                <span>{getRelativeTime(task.date)}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                                                                                            <MessageSquare size={12} />
                                                                                            <span>2</span>
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>2 comments</TooltipContent>
                                                                                </Tooltip>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-help">
                                                                                            <Paperclip size={12} />
                                                                                            <span>1</span>
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>1 attachment</TooltipContent>
                                                                                </Tooltip>
                                                                            </div>
                                                                        </div>
                                                                        <Facepile members={[]} />
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}

                                                    {/* Empty State Button */}
                                                    <button
                                                        onClick={() => handleAddTaskToColumn(colId)}
                                                        className="w-full py-4 border-2 border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} />
                                                        Add Task
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full overflow-y-auto p-6"
                            >
                                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                                                <th className="px-6 py-4 font-black">Status</th>
                                                <th className="px-6 py-4 font-black">Task Details</th>
                                                <th className="px-6 py-4 font-black">Priority</th>
                                                <th className="px-6 py-4 font-black">Due Date</th>
                                                <th className="px-6 py-4 font-black text-right">Assignee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {tasks.length > 0 ? tasks.map(task => {
                                                const project = projects.find(p => p.id === task.projectId);
                                                return (
                                                    <tr
                                                        key={task.id}
                                                        className="group hover:bg-secondary/20 transition-all cursor-pointer"
                                                        onClick={() => handleEditTask(task)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUpdateTask({ ...task, completed: !task.completed, statusLabel: !task.completed ? 'DONE' : 'TODO' });
                                                                    }}
                                                                    className="text-muted-foreground group-hover:text-indigo-500 transition-colors"
                                                                >
                                                                    {task.completed ? (
                                                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                                                    ) : (
                                                                        <Circle size={18} />
                                                                    )}
                                                                </button>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[9px] font-bold px-1.5 py-0 h-4 border-none",
                                                                    columnColors[task.statusLabel || 'TODO'],
                                                                    "bg-opacity-10 text-opacity-100",
                                                                    task.statusLabel === 'DONE' ? "text-emerald-600 bg-emerald-100" :
                                                                        task.statusLabel === 'REVIEW' ? "text-amber-600 bg-amber-100" :
                                                                            task.statusLabel === 'IN_PROGRESS' ? "text-blue-600 bg-blue-100" :
                                                                                "text-slate-600 bg-slate-100"
                                                                )}>
                                                                    {task.statusLabel?.replace('_', ' ') || 'TODO'}
                                                                </Badge>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-0.5">
                                                                <div className={cn(
                                                                    "text-sm font-bold text-foreground group-hover:text-primary transition-colors",
                                                                    task.completed && "line-through text-muted-foreground"
                                                                )}>
                                                                    {task.title}
                                                                </div>
                                                                {project && (
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                                                        {project.title}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <PriorityBadge priority={task.priority} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                                                <Clock size={14} className="group-hover:text-indigo-500 transition-colors" />
                                                                {getRelativeTime(task.date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end">
                                                                <Facepile members={[]} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <CheckSquare size={32} className="opacity-20" />
                                                            <p className="font-bold">No tasks found</p>
                                                            <p className="text-xs">Create your first task to get started.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Modals */}
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
                    defaultStatus={modalDefaultStatus}
                />

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
                    onLinkTasks={(taskIds, projectId) => {
                        taskIds.forEach(tid => {
                            const task = tasks.find(t => t.id === tid);
                            if (task) onUpdateTask({ ...task, projectId });
                        });
                    }}
                />
            </div>
        </TooltipProvider>
    );
};
