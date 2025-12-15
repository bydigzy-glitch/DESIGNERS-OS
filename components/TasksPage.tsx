
import React, { useState } from 'react';
import { Task, Project } from '../types';
import { CheckSquare, Plus, Zap, GripVertical, Edit2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskModal } from './modals/TaskModal';
import { ProjectModal } from './modals/ProjectModal';
import { TasksTable } from './common/TasksTable';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from './common/AnimatedComponents';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

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

// Editable Column Header Component
const ColumnHeader = ({ title, count, onRename, onAdd, color }: { title: string, count: number, onRename: (newTitle: string) => void, onAdd: () => void, color: string }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleSave = () => {
        if (tempTitle.trim()) {
            onRename(tempTitle);
        } else {
            setTempTitle(title);
        }
        setIsEditing(false);
    };

    return (
        <div className={`p-4 border-b border-border flex justify-between items-center bg-card rounded-t-2xl border-t-4`} style={{ borderTopColor: color }}>
            <div className="flex items-center gap-2 flex-1">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            autoFocus
                            className="bg-secondary text-sm font-bold text-foreground px-2 py-1 rounded w-full outline-none border border-primary/50"
                        />
                        <button onMouseDown={handleSave} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check size={14} /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                        <h3 className="font-bold text-sm text-foreground">{title}</h3>
                        <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                {!isEditing && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">{count}</span>}
            </div>
            <button onClick={onAdd} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <Plus size={16} />
            </button>
        </div>
    );
};

export const TasksPage: React.FC<TasksPageProps> = ({
    tasks, projects, onUpdateTask, onDeleteTask, onAddTask,
    onUpdateProject, onAddProject, onDeleteProject
}) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [modalDefaultStatus, setModalDefaultStatus] = useState<'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('TODO');

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);
    const [expandedCols, setExpandedCols] = useState<Record<string, boolean>>({});

    // Column Config - strictly matches request: To-Do, In Progress, Revision, Done
    const [columnTitles, setColumnTitles] = useState<Record<string, string>>({
        TODO: 'To-Do',
        IN_PROGRESS: 'In Progress',
        REVIEW: 'Revision',
        DONE: 'Done'
    });

    const columnColors: Record<string, string> = {
        TODO: '#64748b', // Slate
        IN_PROGRESS: '#3b82f6', // Blue
        REVIEW: '#f59e0b', // Amber/Orange
        DONE: '#10b981' // Emerald
    };

    const activeProjects = projects.filter(p => p.status === 'ACTIVE');
    const pendingTasksCount = tasks.filter(t => !t.completed).length;

    const columnKeys = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

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
                const validStatus = status as 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

                onUpdateTask({
                    ...task,
                    statusLabel: validStatus,
                    completed: status === 'DONE'
                });
            }
            setDraggedTaskId(null);
        }
    };

    const handleEditTask = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleAddTaskToColumn = (status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE') => {
        setSelectedTask(null);
        setModalDefaultStatus(status);
        setIsTaskModalOpen(true);
    }

    const getPriorityColor = (p?: string) => {
        switch (p) {
            case 'HIGH': return 'bg-teal-500/20 text-teal-500 border-teal-500/20';
            case 'MEDIUM': return 'bg-orange-500/20 text-orange-500 border-orange-500/20';
            case 'LOW': return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
        }
    };

    const renameColumn = (key: string, newTitle: string) => {
        setColumnTitles(prev => ({ ...prev, [key]: newTitle }));
    };

    const toggleColumnExpanded = (colId: string) => {
        setExpandedCols(prev => ({ ...prev, [colId]: !prev[colId] }));
    };

    return (
        <TooltipProvider delayDuration={300}>
            <FadeIn className="flex flex-col h-full w-full pb-24 md:pb-0 space-y-6 pr-2 overflow-y-auto scrollbar-hide">

                {/* Top Stats Row */}
                <div className="flex flex-col md:flex-row gap-6 flex-shrink-0">
                    {/* Projects Card Summary */}
                    <div className="flex-1 bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Active Projects</h3>
                                <p className="text-xs text-muted-foreground">{activeProjects.length} projects in progress</p>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button onClick={() => { setSelectedProject(null); setIsProjectModalOpen(true); }} className="p-2 bg-secondary rounded-lg hover:bg-white/10 transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add new project</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="space-y-3 relative z-10 max-h-32 overflow-y-auto pr-1">
                            {activeProjects.slice(0, 3).map(p => (
                                <div key={p.id} onClick={() => { setSelectedProject(p); setIsProjectModalOpen(true); }} className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/5" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                                            <Zap size={14} fill="currentColor" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground truncate max-w-[120px]">{p.title}</div>
                                            <div className="text-[10px] text-muted-foreground">{p.progress}% Done</div>
                                        </div>
                                    </div>
                                    <div className="w-16 bg-secondary h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${p.progress}%`, backgroundColor: p.color }}></div>
                                    </div>
                                </div>
                            ))}
                            {activeProjects.length === 0 && <div className="text-sm text-muted-foreground">No active projects.</div>}
                        </div>
                        {/* Decorative bg */}
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    </div>

                    {/* Task Summary Card */}
                    <div className="flex-1 bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Tasks Overview</h3>
                                <p className="text-xs text-muted-foreground">Manage your daily flow</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <CheckSquare size={20} />
                            </div>
                        </div>
                        <div className="flex items-end gap-2 mt-4 relative z-10">
                            <span className="text-4xl font-bold text-foreground tracking-tighter">{pendingTasksCount}</span>
                            <span className="text-sm font-medium text-muted-foreground mb-1">pending tasks</span>
                        </div>
                        <div className="mt-6 flex gap-2 relative z-10">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="flex-1 bg-foreground text-background font-bold py-2 rounded-xl text-xs hover:bg-foreground/80 transition-colors">
                                        + Add Task
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Create a new task</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                </div>

                {/* KANBAN BOARD */}
                <div className="flex-none overflow-x-auto overflow-y-hidden pb-4 min-h-[500px]">
                    <div className="flex gap-6 h-full min-w-[1000px] px-1">
                        {columnKeys.map(colId => {
                            const colTasks = tasks.filter(t =>
                                (t.statusLabel === colId) ||
                                (colId === 'TODO' && !t.statusLabel && !t.completed)
                            );

                            const isExpanded = expandedCols[colId];
                            const visibleTasks = isExpanded ? colTasks : colTasks.slice(0, 5);
                            const hiddenCount = colTasks.length - 5;

                            return (
                                <div
                                    key={colId}
                                    className={`flex-1 flex flex-col min-w-[280px] bg-secondary/10 rounded-2xl border transition-colors h-full ${dragOverCol === colId ? 'border-primary bg-secondary/30' : 'border-border'}`}
                                    onDragOver={(e) => handleDragOver(e, colId)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, colId)}
                                >
                                    <ColumnHeader
                                        title={columnTitles[colId]}
                                        count={colTasks.length}
                                        onRename={(t) => renameColumn(colId, t)}
                                        onAdd={() => handleAddTaskToColumn(colId as any)}
                                        color={columnColors[colId]}
                                    />

                                    {/* Tasks Area */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                        <AnimatePresence initial={false} mode="popLayout">
                                            {visibleTasks.map(task => (
                                                <motion.div
                                                    key={task.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    transition={{ duration: 0.2 }}
                                                    draggable
                                                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                                                    onClick={(e) => handleEditTask(e, task)}
                                                    className="bg-card p-4 rounded-xl border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 group relative"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        {task.priority && (
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                                        )}
                                                        <div className="p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <GripVertical size={14} />
                                                        </div>
                                                    </div>

                                                    <h4 className={`text-sm font-bold text-foreground mb-1 leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h4>

                                                    {/* Tags / Project */}
                                                    {task.projectId && (
                                                        <div className="flex items-center gap-1.5 mt-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color || '#ccc' }}></div>
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                {projects.find(p => p.id === task.projectId)?.title || 'Project'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Time Preview */}
                                                    <div className="text-[9px] text-muted-foreground mt-1">
                                                        {new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {/* Add Task Button */}
                                        <button
                                            onClick={() => handleAddTaskToColumn(colId as any)}
                                            className="w-full py-2 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-secondary/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Add Task
                                        </button>

                                        {/* View More / Less Toggle */}
                                        {colTasks.length > 5 && (
                                            <button
                                                onClick={() => toggleColumnExpanded(colId)}
                                                className="w-full py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1"
                                            >
                                                {isExpanded ? (
                                                    <>View Less <ChevronUp size={12} /></>
                                                ) : (
                                                    <>View {hiddenCount} More <ChevronDown size={12} /></>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Tasks Table (Reused Component) */}
                <TasksTable
                    tasks={tasks}
                    projects={projects}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onAddTask={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                    onSelectTask={(task) => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                    title="All Tasks"
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
            </FadeIn>
        </TooltipProvider>
    );
};
