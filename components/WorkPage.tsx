
import React, { useState, useMemo } from 'react';
import { Task, Project, Client } from '../types';
import {
    Plus,
    Briefcase,
    CheckSquare,
    Clock,
    AlertTriangle,
    Filter,
    LayoutGrid,
    List,
    ChevronRight,
    MoreHorizontal,
    Edit2,
    Trash2,
    Play,
    Pause,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { TaskModal } from './modals/TaskModal';
import { ProjectModal } from './modals/ProjectModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

interface WorkPageProps {
    tasks: Task[];
    projects: Project[];
    clients: Client[];
    onAddTask: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onAddProject: (project: Project) => void;
    onUpdateProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
    INTAKE: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
    PAUSED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    REVISION: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    ARCHIVED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const TASK_STATUS_COLORS: Record<string, string> = {
    BACKLOG: 'bg-gray-500/10 text-gray-400',
    TODO: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-yellow-500/10 text-yellow-500',
    REVIEW: 'bg-purple-500/10 text-purple-500',
    DONE: 'bg-green-500/10 text-green-500',
};

export const WorkPage: React.FC<WorkPageProps> = ({
    tasks,
    projects,
    clients,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onAddProject,
    onUpdateProject,
    onDeleteProject,
}) => {
    const [activeTab, setActiveTab] = useState<'projects' | 'tasks'>('projects');
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [filterProjectStatus, setFilterProjectStatus] = useState<string | null>(null);

    // Calculate stats
    const stats = useMemo(() => {
        const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
        const pendingTasks = tasks.filter(t => !t.completed).length;
        const overdueTasks = tasks.filter(t => !t.completed && new Date(t.date) < new Date()).length;
        const pipelineValue = projects
            .filter(p => p.status === 'ACTIVE' || p.status === 'INTAKE')
            .reduce((s, p) => s + (p.price || 0), 0);

        return { activeProjects, pendingTasks, overdueTasks, pipelineValue };
    }, [tasks, projects]);

    // Filter projects
    const filteredProjects = filterProjectStatus
        ? projects.filter(p => p.status === filterProjectStatus)
        : projects;

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const groups: Record<string, Task[]> = {
            TODO: [],
            IN_PROGRESS: [],
            REVIEW: [],
            DONE: [],
        };
        tasks.forEach(t => {
            const status = t.statusLabel || (t.completed ? 'DONE' : 'TODO');
            if (groups[status]) {
                groups[status].push(t);
            }
        });
        return groups;
    }, [tasks]);

    const handleProjectStatusChange = (project: Project, newStatus: Project['status']) => {
        onUpdateProject({ ...project, status: newStatus });
    };

    const getClientName = (clientId?: string) => {
        if (!clientId) return 'No client';
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'Unknown';
    };

    return (
        <div className="flex flex-col h-full w-full space-y-6 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">

            {/* Header */}
            <FadeIn>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Work</h1>
                        <p className="text-sm text-muted-foreground mt-1">Projects and tasks in one unified view</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} className="gap-2">
                            <CheckSquare size={16} />
                            Add Task
                        </Button>
                        <Button onClick={() => { setSelectedProject(null); setIsProjectModalOpen(true); }} className="gap-2">
                            <Plus size={16} />
                            Add Project
                        </Button>
                    </div>
                </div>
            </FadeIn>

            {/* Stats Row */}
            <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Briefcase size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={stats.activeProjects} /></div>
                                <div className="text-xs text-muted-foreground">Active Projects</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <CheckSquare size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={stats.pendingTasks} /></div>
                                <div className="text-xs text-muted-foreground">Pending Tasks</div>
                            </div>
                        </div>
                    </Card>
                    <Card className={`p-4 ${stats.overdueTasks > 0 ? 'border-red-500/30' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold"><CountUp value={stats.overdueTasks} /></div>
                                <div className="text-xs text-muted-foreground">Overdue</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <Clock size={18} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">$<CountUp value={stats.pipelineValue} /></div>
                                <div className="text-xs text-muted-foreground">Pipeline</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </FadeIn>

            {/* Tabs */}
            <FadeIn delay={0.2}>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full max-w-[300px] grid-cols-2">
                        <TabsTrigger value="projects" className="gap-2">
                            <Briefcase size={14} />
                            Projects
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="gap-2">
                            <CheckSquare size={14} />
                            Tasks
                        </TabsTrigger>
                    </TabsList>

                    {/* Projects Tab */}
                    <TabsContent value="projects" className="mt-6">
                        {/* Status Filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            {['INTAKE', 'ACTIVE', 'PAUSED', 'REVISION', 'COMPLETED'].map(status => (
                                <Button
                                    key={status}
                                    variant={filterProjectStatus === status ? 'default' : 'outline'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setFilterProjectStatus(filterProjectStatus === status ? null : status)}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>

                        {/* Projects Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProjects.map(project => (
                                <Card key={project.id} className="overflow-hidden hover:border-primary/30 transition-all group">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="project-icon-base"
                                                    style={{ '--project-color': project.color } as React.CSSProperties}
                                                >
                                                    {project.title.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground leading-none mb-1">{project.title}</h3>
                                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{getClientName(project.clientId)}</div>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setSelectedProject(project); setIsProjectModalOpen(true); }}>
                                                        <Edit2 size={14} className="mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleProjectStatusChange(project, 'ACTIVE')}>
                                                        <Play size={14} className="mr-2" /> Set Active
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleProjectStatusChange(project, 'PAUSED')}>
                                                        <Pause size={14} className="mr-2" /> Pause
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleProjectStatusChange(project, 'COMPLETED')}>
                                                        <CheckCircle2 size={14} className="mr-2" /> Complete
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-red-500">
                                                        <Trash2 size={14} className="mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <Badge variant="outline" className={`text-[10px] mb-3 ${PROJECT_STATUS_COLORS[project.status]}`}>
                                            {project.status}
                                        </Badge>

                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{project.progress}%</span>
                                            </div>
                                            <Progress value={project.progress} className="h-1.5" />
                                        </div>

                                        <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                                            <span className="font-mono font-bold text-foreground">${(project.price || 0).toLocaleString()}</span>
                                            {project.deadline && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar size={12} />
                                                    <span className="text-xs">{new Date(project.deadline).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredProjects.length === 0 && (
                                <div className="col-span-full text-center py-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                                        <Briefcase size={20} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1">No Projects Found</h3>
                                    <p className="text-sm text-muted-foreground max-w-[280px]">
                                        Your pipeline is clear. Use the button above to start a new project.
                                    </p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tasks Tab - Quick Kanban View */}
                    <TabsContent value="tasks" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                                <Card key={status} className="min-h-[300px]">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${TASK_STATUS_COLORS[status]}`}>
                                                    {status.replace('_', ' ')}
                                                </span>
                                            </span>
                                            <Badge variant="secondary" className="text-xs">{statusTasks.length}</Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {statusTasks.slice(0, 5).map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                                                className="p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-primary/30 cursor-pointer transition-all group"
                                            >
                                                <div className="font-medium text-sm text-foreground truncate">{task.title}</div>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                                    {task.priority && (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                                                            {task.priority}
                                                        </Badge>
                                                    )}
                                                    <span>{new Date(task.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {statusTasks.length > 5 && (
                                            <div className="text-xs text-muted-foreground text-center py-2">
                                                +{statusTasks.length - 5} more
                                            </div>
                                        )}
                                        {statusTasks.length === 0 && (
                                            <div className="text-xs text-muted-foreground text-center py-4">
                                                No tasks
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </FadeIn>

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
                clients={clients}
            />
        </div>
    );
};
