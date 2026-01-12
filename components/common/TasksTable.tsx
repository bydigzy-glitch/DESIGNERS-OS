

import React from 'react';
import { Task, Project, TeamMember } from '../../types';
import { CheckCircle2, Trash2, Calendar, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface TasksTableProps {
    tasks: Task[];
    projects: Project[];
    teamMembers?: TeamMember[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: () => void;
    onSelectTask: (task: Task) => void;
    title?: string;
}

export const TasksTable: React.FC<TasksTableProps> = ({
    tasks, projects, teamMembers = [], onUpdateTask, onDeleteTask, onAddTask, onSelectTask, title = "All Tasks"
}) => {
    const getPriorityColor = (p?: string) => {
        switch (p) {
            case 'HIGH': return 'bg-teal-500/20 text-teal-500 border-teal-500/20';
            case 'MEDIUM': return 'bg-orange-500/20 text-orange-500 border-orange-500/20';
            case 'LOW': return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
        }
    };

    const getAssignee = (id?: string) => {
        if (!id) return null;
        return teamMembers.find(m => m.id === id);
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
            <div className="p-6 border-b border-border flex justify-between items-center flex-shrink-0">
                <h3 className="text-h3">{title}</h3>
                <Button onClick={onAddTask} size="sm" className="gap-2">
                    <Plus size={14} /> Add Task
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="min-w-[800px] text-left">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-secondary/30 text-overline sticky top-0 backdrop-blur-md z-10 text-muted-foreground">
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-4">Task Name</div>
                        <div className="col-span-1 text-center">Assignee</div>
                        <div className="col-span-2">Due Date</div>
                        <div className="col-span-2">Priority</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {tasks.map(task => {
                            const assignee = getAssignee(task.assignedTo);
                            return (
                                <div key={task.id} onClick={() => onSelectTask(task)} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/20 transition-colors cursor-pointer group">
                                    <div className="col-span-1 flex justify-center">
                                        <Checkbox
                                            checked={task.completed}
                                            onCheckedChange={(checked) => {
                                                onUpdateTask({ ...task, completed: checked as boolean, statusLabel: checked ? 'DONE' : 'TODO' });
                                            }}
                                            className="w-5 h-5"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <div className={`text-body-emphasis truncate ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</div>
                                        {task.projectId && projects.find(p => p.id === task.projectId) && (
                                            <div className="text-overline text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color || 'currentColor' }}
                                                ></div>
                                                {projects.find(p => p.id === task.projectId)?.title}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {assignee ? (
                                            <div className="relative group/avatar">
                                                <img
                                                    src={assignee.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.email}`}
                                                    className="w-6 h-6 rounded-full bg-secondary object-cover border border-border"
                                                    alt={assignee.name || "Team member"}
                                                    title={assignee.name || "Team member"}
                                                />
                                                <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-overline px-1.5 py-0.5 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                    {assignee.name || assignee.email.split('@')[0]}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground">
                                                <User size={12} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-foreground text-caption flex items-center gap-1.5">
                                        <Calendar size={14} className="text-muted-foreground" />
                                        {new Date(task.date).toLocaleDateString()}
                                    </div>
                                    <div className="col-span-2">
                                        {task.priority && (
                                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all h-8 w-8"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                        {tasks.length === 0 && (
                            <div className="py-8 text-center text-muted-foreground">No tasks found.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
