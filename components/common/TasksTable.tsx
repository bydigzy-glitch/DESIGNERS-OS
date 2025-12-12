
import React from 'react';
import { Task, Project } from '../../types';
import { CheckCircle2, Trash2, Calendar, Plus } from 'lucide-react';

interface TasksTableProps {
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: () => void;
  onSelectTask: (task: Task) => void;
  title?: string;
}

export const TasksTable: React.FC<TasksTableProps> = ({ 
    tasks, projects, onUpdateTask, onDeleteTask, onAddTask, onSelectTask, title = "All Tasks"
}) => {
  const getPriorityColor = (p?: string) => {
      switch(p) {
          case 'HIGH': return 'bg-teal-500/20 text-teal-500 border-teal-500/20';
          case 'MEDIUM': return 'bg-orange-500/20 text-orange-500 border-orange-500/20';
          case 'LOW': return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
          default: return 'bg-gray-500/20 text-gray-500 border-gray-500/20';
      }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
       <div className="p-6 border-b border-border flex justify-between items-center flex-shrink-0">
           <h3 className="text-lg font-bold text-foreground">{title}</h3>
           <button onClick={onAddTask} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
               <Plus size={14} /> Add Task
           </button>
       </div>
       
       <div className="flex-1 overflow-x-auto">
           <div className="min-w-[800px] text-left text-xs">
               {/* Table Header */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-secondary/30 text-muted-foreground font-bold uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                   <div className="col-span-1 text-center">Status</div>
                   <div className="col-span-5">Task Name</div>
                   <div className="col-span-2">Due Date</div>
                   <div className="col-span-2">Priority</div>
                   <div className="col-span-2 text-right">Actions</div>
               </div>

               {/* Table Body */}
               <div className="divide-y divide-border">
                   {tasks.map(task => (
                       <div key={task.id} onClick={() => onSelectTask(task)} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/20 transition-colors cursor-pointer group">
                           <div className="col-span-1 flex justify-center">
                               <button 
                                  onClick={(e) => { e.stopPropagation(); onUpdateTask({ ...task, completed: !task.completed, statusLabel: !task.completed ? 'DONE' : 'TODO' }); }}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground hover:border-primary'}`}
                               >
                                   {task.completed && <CheckCircle2 size={12} className="text-black" />}
                               </button>
                           </div>
                           <div className="col-span-5">
                               <div className={`text-sm font-bold truncate ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</div>
                               {task.projectId && projects.find(p => p.id === task.projectId) && (
                                   <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color }}></div>
                                       {projects.find(p => p.id === task.projectId)?.title}
                                   </div>
                               )}
                           </div>
                           <div className="col-span-2 text-foreground font-medium flex items-center gap-1.5">
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
                               <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={16} />
                               </button>
                           </div>
                       </div>
                   ))}
                   {tasks.length === 0 && (
                       <div className="py-8 text-center text-muted-foreground">No tasks found.</div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
};
