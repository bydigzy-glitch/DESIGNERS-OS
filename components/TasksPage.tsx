
import React, { useState } from 'react';
import { Task, Project } from '../types';
import {
    Plus, Clock, MessageSquare, Paperclip,
    MoreHorizontal, LayoutGrid, List, CheckCircle2, Circle
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
        CRITICAL: { label: 'Critical', class: 'bg-red-50 text-red-600 border-red-100/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' },
        HIGH: { label: 'High', class: 'bg-orange-50 text-orange-600 border-orange-100/50 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
        MEDIUM: { label: 'Medium', class: 'bg-blue-50 text-blue-600 border-blue-100/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
        LOW: { label: 'Low', class: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' },
    };

    if (!priority) return null;
    const { label, class: className } = config[priority] || config.MEDIUM;

    return (
        <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0 border-0 shadow-none", className)}>
            {label}
        </Badge>
    );
};

// Sub-component: Facepile
const Facepile = ({ members = [] }: { members?: any[] }) => {
    const displayMembers = members.length > 0 ? members : [{ id: 'admin', name: 'Digzy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Digzy' }];

    return (
        <div className="flex -space-x-1.5 overflow-hidden">
            {displayMembers.slice(0, 2).map((m, i) => (
                <Avatar key={m.id || i} className="inline-block h-5 w-5 rounded-full ring-2 ring-card border-none">
                    <AvatarImage src={m.avatar} alt={m.name} />
                    <AvatarFallback className="text-[8px] bg-secondary">{m.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
            ))}
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

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);

    const columnKeys: Task['statusLabel'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const columnColors: Record<string, string> = {
        TODO: 'bg-[#d1d5db]', // Grey
        IN_PROGRESS: 'bg-[#3b82f6]', // Blue
        REVIEW: 'bg-[#f59e0b]', // Orange/Amber
        DONE: 'bg-[#10b981]' // Green
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

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTaskId(taskId);
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        if (dragOverCol !== colId) setDragOverCol(colId);
    };

    const handleDragLeave = () => {
        setDragOverCol(null);
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverCol(null);
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task) {
                const validStatus = status as Task['statusLabel'];
                onUpdateTask({ ...task, statusLabel: validStatus, completed: status === 'DONE' });
            }
            setDraggedTaskId(null);
        }
    };

    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const d = new Date(date);
        const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex flex-col h-full w-full bg-[#fbfbfd] dark:bg-background overflow-hidden px-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-12 flex-shrink-0">
                    <div>
                        <h1 className="text-4xl font-black text-[#1d1d1f] dark:text-foreground tracking-tight mb-2">Task Management</h1>
                        <p className="text-sm text-[#86868b] dark:text-muted-foreground font-medium">Cross-project tasks assigned to you and your team.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center p-1 bg-[#f5f5f7] dark:bg-secondary/50 rounded-lg border border-border/50">
                            <button
                                onClick={() => setActiveView('KANBAN')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200",
                                    activeView === 'KANBAN'
                                        ? "bg-white dark:bg-background text-[#1d1d1f] dark:text-foreground shadow-sm"
                                        : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-foreground"
                                )}
                            >
                                Kanban
                            </button>
                            <button
                                onClick={() => setActiveView('LIST')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all duration-200",
                                    activeView === 'LIST'
                                        ? "bg-white dark:bg-background text-[#1d1d1f] dark:text-foreground shadow-sm"
                                        : "text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-foreground"
                                )}
                            >
                                List
                            </button>
                        </div>

                        <Button
                            onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                            className="bg-[#0071e3] hover:bg-[#0071e3]/90 text-white rounded-lg font-bold h-10 px-6 shadow-sm"
                        >
                            <Plus size={18} className="mr-2" strokeWidth={3} />
                            New Task
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {activeView === 'KANBAN' ? (
                            <motion.div
                                key="kanban"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full overflow-x-auto overflow-y-hidden pb-8 custom-scrollbar"
                            >
                                <div className="flex gap-8 h-full min-w-max">
                                    {columnKeys.map(colId => {
                                        const colTasks = tasks.filter(t =>
                                            (t.statusLabel === colId) ||
                                            (colId === 'TODO' && !t.statusLabel && !t.completed)
                                        );

                                        return (
                                            <div
                                                key={colId}
                                                className={cn(
                                                    "flex flex-col w-[320px] h-full transition-all duration-200",
                                                    dragOverCol === colId && "scale-[1.02]"
                                                )}
                                                onDragOver={(e) => handleDragOver(e, colId || 'TODO')}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, colId || 'TODO')}
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-6 px-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-2 h-2 rounded-full", columnColors[colId || 'TODO'])} />
                                                        <h3 className="text-[13px] font-black text-[#1d1d1f] dark:text-foreground flex items-center gap-1.5">
                                                            {colId === 'TODO' ? 'To Do' : colId?.replace('_', ' ')}
                                                            <span className="text-[#86868b] font-medium ml-1">{colTasks.length}</span>
                                                        </h3>
                                                    </div>
                                                    <button className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-foreground transition-colors">
                                                        <MoreHorizontal size={18} />
                                                    </button>
                                                </div>

                                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pb-24">
                                                    {colTasks.map(task => {
                                                        const project = projects.find(p => p.id === task.projectId);
                                                        return (
                                                            <motion.div
                                                                key={task.id}
                                                                layout
                                                                draggable
                                                                onDragStart={(e: any) => handleDragStart(e, task.id)}
                                                                className="bg-white dark:bg-card p-5 rounded-2xl border border-border/40 hover:border-border transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] group"
                                                                onClick={() => handleEditTask(task)}
                                                            >
                                                                <div className="flex flex-col gap-4">
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#86868b]">
                                                                            {project?.title.split(' ')[0] || 'GENERAL'}
                                                                        </span>
                                                                        <PriorityBadge priority={task.priority} />
                                                                    </div>

                                                                    <h4 className={cn(
                                                                        "text-[15px] font-bold text-[#1d1d1f] dark:text-foreground leading-snug",
                                                                        task.completed && "line-through text-muted-foreground opacity-60"
                                                                    )}>
                                                                        {task.title}
                                                                    </h4>

                                                                    <div className="flex items-center justify-between pt-1">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#86868b]">
                                                                                <Paperclip size={14} className="opacity-40" />
                                                                                <span>2</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#86868b]">
                                                                                <MessageSquare size={14} className="opacity-40" />
                                                                                <span>5</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#86868b]">
                                                                                <Clock size={14} className="opacity-40" />
                                                                                <span>{getRelativeTime(task.date)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <Facepile />
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}

                                                    <button
                                                        onClick={() => handleAddTaskToColumn(colId)}
                                                        className="w-full py-3.5 border border-dashed border-border/60 rounded-xl text-[11px] font-bold text-[#86868b] hover:border-border hover:bg-white dark:hover:bg-secondary/20 transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        <Plus size={14} className="group-hover:scale-110 transition-transform" />
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full overflow-y-auto pb-8"
                            >
                                <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#f5f5f7] dark:bg-secondary/30 text-[9px] font-black uppercase tracking-widest text-[#86868b] border-b border-border/40">
                                                <th className="px-6 py-5">Status</th>
                                                <th className="px-6 py-5">Task Details</th>
                                                <th className="px-6 py-5">Priority</th>
                                                <th className="px-6 py-5">Due Date</th>
                                                <th className="px-6 py-5 text-right">Assignee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {tasks.map(task => {
                                                const project = projects.find(p => p.id === task.projectId);
                                                return (
                                                    <tr
                                                        key={task.id}
                                                        className="group hover:bg-[#fbfbfd] dark:hover:bg-secondary/10 transition-all cursor-pointer"
                                                        onClick={() => handleEditTask(task)}
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onUpdateTask({ ...task, completed: !task.completed, statusLabel: !task.completed ? 'DONE' : 'TODO' });
                                                                    }}
                                                                    className="text-[#86868b] group-hover:text-indigo-500 transition-colors"
                                                                >
                                                                    {task.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                                                                </button>
                                                                <Badge variant="outline" className={cn(
                                                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 border-0",
                                                                    columnColors[task.statusLabel || 'TODO'],
                                                                    "bg-opacity-10 text-opacity-100",
                                                                    task.statusLabel === 'DONE' ? "text-emerald-600 bg-emerald-100" :
                                                                        task.statusLabel === 'REVIEW' ? "text-orange-600 bg-orange-100" :
                                                                            task.statusLabel === 'IN_PROGRESS' ? "text-blue-600 bg-blue-100" :
                                                                                "text-slate-600 bg-slate-100"
                                                                )}>
                                                                    {task.statusLabel?.replace('_', ' ') || 'TODO'}
                                                                </Badge>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="space-y-0.5">
                                                                <div className={cn("text-sm font-bold text-[#1d1d1f] dark:text-foreground", task.completed && "line-through opacity-40")}>
                                                                    {task.title}
                                                                </div>
                                                                {project && <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#86868b]">{project.title}</p>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <PriorityBadge priority={task.priority} />
                                                        </td>
                                                        <td className="px-6 py-5 font-bold text-[11px] text-[#86868b]">
                                                            {getRelativeTime(task.date)}
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex justify-end"><Facepile /></div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

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
