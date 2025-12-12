
import React, { useState } from 'react';
import { User, Task, Project, TeamMember } from '../types';
import { Users, Plus, Shield, ShieldCheck, Eye, Trash2, Mail } from 'lucide-react';
import { TasksTable } from './common/TasksTable';
import { TaskModal } from './modals/TaskModal';
import { FadeIn } from './common/AnimatedComponents';

interface TeamPageProps {
  user: User;
  tasks: Task[];
  projects: Project[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateUser: (user: User) => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ 
    user, tasks, projects, onUpdateTask, onDeleteTask, onAddTask, onUpdateUser 
}) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const teamMembers = user.teamMembers || [];

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberEmail.trim()) return;
      
      const newMember: TeamMember = {
          id: Date.now().toString(),
          email: newMemberEmail,
          role: 'VIEWER',
          status: 'INVITED',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMemberEmail}`
      };

      const updatedMembers = [...teamMembers, newMember];
      onUpdateUser({ ...user, teamMembers: updatedMembers });
      setNewMemberEmail('');
      setIsInviting(false);
  };

  const removeMember = (id: string) => {
      if (confirm('Remove this member?')) {
          const updatedMembers = teamMembers.filter(m => m.id !== id);
          onUpdateUser({ ...user, teamMembers: updatedMembers });
      }
  };

  const updateRole = (id: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') => {
      const updatedMembers = teamMembers.map(m => m.id === id ? { ...m, role } : m);
      onUpdateUser({ ...user, teamMembers: updatedMembers });
  };

  return (
    <FadeIn className="flex flex-col h-full w-full space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2">
       
       <div className="flex justify-between items-center">
           <div>
               <h1 className="text-3xl font-bold text-foreground tracking-tight">My Team</h1>
               <p className="text-sm text-muted-foreground">Collaborate with your squad.</p>
           </div>
           <button 
                onClick={() => setIsInviting(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-glow"
           >
               <Plus size={16} /> Invite Member
           </button>
       </div>

       {/* Members Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Current User Card */}
           <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
               <div className="relative">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                       <img src={user.avatar} className="w-full h-full object-cover" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-card">OWNER</div>
               </div>
               <div>
                   <div className="font-bold text-foreground">{user.name}</div>
                   <div className="text-xs text-muted-foreground">{user.email}</div>
               </div>
           </div>

           {/* Team Members */}
           {teamMembers.map(member => (
               <div key={member.id} className="bg-card border border-border p-6 rounded-2xl flex flex-col justify-between group">
                   <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full overflow-hidden border border-border">
                               <img src={member.avatar} className="w-full h-full object-cover" />
                           </div>
                           <div>
                               <div className="font-bold text-foreground">{member.name || 'Pending Invite'}</div>
                               <div className="text-xs text-muted-foreground">{member.email}</div>
                           </div>
                       </div>
                       <button onClick={() => removeMember(member.id)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Trash2 size={16} />
                       </button>
                   </div>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-border">
                       <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                           {member.status}
                       </div>
                       <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                           {(['VIEWER', 'EDITOR', 'ADMIN'] as const).map(role => (
                               <button 
                                    key={role}
                                    onClick={() => updateRole(member.id, role)}
                                    className={`p-1.5 rounded-md transition-colors ${member.role === role ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title={role}
                               >
                                   {role === 'ADMIN' && <ShieldCheck size={14} />}
                                   {role === 'EDITOR' && <Shield size={14} />}
                                   {role === 'VIEWER' && <Eye size={14} />}
                               </button>
                           ))}
                       </div>
                   </div>
               </div>
           ))}
       </div>

       {/* Shared Workspace / Tasks */}
       <div>
           <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-secondary rounded-lg"><Users size={18} /></div>
               <h2 className="text-xl font-bold text-foreground">Team Workspace</h2>
           </div>
           <TasksTable 
                tasks={tasks} 
                projects={projects} 
                onUpdateTask={onUpdateTask} 
                onDeleteTask={onDeleteTask} 
                onAddTask={() => { setSelectedTask(null); setIsTaskModalOpen(true); }} 
                onSelectTask={(task) => { setSelectedTask(task); setIsTaskModalOpen(true); }} 
                title="Shared Tasks"
           />
       </div>

       {/* Invite Modal */}
       {isInviting && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsInviting(false)}>
               <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                   <h3 className="font-bold text-lg mb-4 text-foreground">Invite Team Member</h3>
                   <form onSubmit={handleInvite}>
                       <div className="relative mb-4">
                           <input 
                                type="email"
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                                className="w-full bg-secondary border border-border rounded-xl p-3 pl-10 text-foreground text-sm focus:outline-none focus:border-primary"
                                placeholder="colleague@brand.com"
                                autoFocus
                                required
                           />
                           <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                       </div>
                       <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                           Send Invite
                       </button>
                   </form>
               </div>
           </div>
       )}

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
    </FadeIn>
  );
};
