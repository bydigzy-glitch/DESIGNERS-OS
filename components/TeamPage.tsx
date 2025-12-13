
import React, { useState, useEffect, useRef } from 'react';
import { User, Task, Project, TeamMember, TeamMessage } from '../types';
import { Users, Plus, TrendingUp, Send, MoreVertical, Trash2, Mail, Flame, Smile } from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { storageService, Backend } from '../services/storageService';
import { TasksTable } from './common/TasksTable';
import { TaskModal } from './modals/TaskModal';

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
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [team, setTeam] = useState<any>(null); // Use robust Team type in real impl

    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load Team Data
    useEffect(() => {
        const loadTeam = () => {
            if (user.teamId) {
                const teamData = Backend.teams.get(user.teamId);
                if (teamData) setTeam(teamData);
            } else {
                setTeam(null);
            }
        };

        loadTeam();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'designpreneur_teams') { // Listen for shared team updates
                loadTeam();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user.teamId]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [team?.messages]);

    const handleCreateTeam = () => {
        const name = `${user.name}'s Squad`;
        const newTeam = Backend.teams.create(user.id, name);
        onUpdateUser({ ...user, teamId: newTeam.id });
    };

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim() || !team) return;

        const result = Backend.teams.invite(team.id, newMemberEmail);
        if (result.success) {
            // Force reload to see update immediately (storage event handles cross-tab, this handles local)
            const updatedTeam = Backend.teams.get(team.id);
            setTeam(updatedTeam);
            setNewMemberEmail('');
            setIsInviting(false);
        } else {
            alert(result.message);
        }
    };

    const removeMember = (id: string) => {
        if (confirm('Remove this member?')) {
            // Logic to remove member from team (Not implemented in Backend yet, adding simplistic placeholder)
            // Ideally: Backend.teams.removeMember(team.id, id);
            alert("Member removal pending implementation.");
        }
    };

    const updateRole = (id: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') => {
        // Backend.teams.updateMemberRole(team.id, id, role);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !team) return;

        Backend.teams.sendMessage(team.id, user.id, chatInput);
        setChatInput('');

        // Local optimistic update not strictly needed if we listen to storage event which we trigger? 
        // Actually we need to force re-fetch or manual set because storage event doesn't fire on same window
        const updatedTeam = Backend.teams.get(team.id);
        setTeam(updatedTeam);
    };

    // Stats
    const teamTasksCompleted = tasks.filter(t => t.completed).length;
    const teamMembers = team ? team.members : [];
    const teamChat = team ? team.messages : [];
    const combinedStreak = teamMembers.reduce((acc: any, m: any) => acc + (m.dailyStreak || 0), 0);

    if (!user.teamId && !team) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="p-8 bg-card border border-border rounded-3xl shadow-glow text-center max-w-md">
                    <div className="mb-4 bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Users size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">No Team Found</h2>
                    <p className="text-muted-foreground mb-6">You aren't part of a squad yet. Create one or ask to be invited.</p>
                    <button
                        onClick={handleCreateTeam}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        Create My Team
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full space-y-6 md:space-y-8 pb-24 md:pb-0 overflow-y-auto scrollbar-hide pr-2 relative">

            {/* Header */}
            <FadeIn>
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-2 md:pt-0">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">{team?.name || 'Team HQ'}</h1>
                        <p className="text-muted-foreground">Manage your squad and communications.</p>
                    </div>
                    <button
                        onClick={() => setIsInviting(true)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-glow w-full md:w-auto justify-center"
                    >
                        <Plus size={16} /> Invite Member
                    </button>
                </div>
            </FadeIn>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-shrink-0">

                {/* Team Velocity Graph */}
                <FadeIn delay={0.1} className="md:col-span-6 lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[200px] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-base font-bold text-foreground">Team Velocity</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                    <CountUp value={teamTasksCompleted * 5} duration={1} />
                                </span>
                                <span className="text-xs text-muted-foreground">points this sprint</span>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 text-blue-500 p-2 rounded-lg">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-secondary/20 rounded-xl relative overflow-hidden flex items-end px-2 gap-2 h-24 md:h-auto">
                        {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 bg-primary/40 rounded-t-sm hover:bg-primary/60 transition-colors" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </FadeIn>

                {/* Squad Streaks */}
                <FadeIn delay={0.2} className="md:col-span-6 lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                <Flame size={20} fill="currentColor" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground block">SQUAD STREAK</span>
                                <span className="text-xl font-bold text-foreground leading-none"><CountUp value={combinedStreak} /> Days</span>
                            </div>
                        </div>
                    </div>

                    {/* Avatars with Rings */}
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Current User in List? Only if in members */}
                        {teamMembers.map((m: any) => (
                            <div key={m.id} className="flex flex-col items-center gap-1 min-w-[50px]">
                                <div className={`w-12 h-12 rounded-full p-0.5 ${m.dailyStreak && m.dailyStreak > 0 ? 'bg-gradient-to-tr from-orange-500 to-yellow-500' : 'bg-secondary'}`}>
                                    <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`} className="w-full h-full rounded-full border-2 border-card object-cover" />
                                </div>
                                <span className="text-[10px] font-bold text-foreground truncate w-14 text-center">{m.name?.split(' ')[0] || 'User'}</span>
                            </div>
                        ))}

                        <button onClick={() => setIsInviting(true)} className="w-12 h-12 rounded-full bg-secondary border border-border border-dashed flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex-shrink-0">
                            <Plus size={18} />
                        </button>
                    </div>
                </FadeIn>
            </div>

            {/* Communication Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">

                {/* TEAM CHAT */}
                <FadeIn delay={0.3} className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm h-[600px] lg:h-auto">
                    <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">General Channel</h3>
                                <span className="text-xs text-muted-foreground">{teamMembers.length} Members Online</span>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground"><MoreVertical size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dots">
                        {teamChat.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                <Users size={48} className="mb-2" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        )}
                        {teamChat.map((msg: any, i: number) => {
                            const isMe = msg.senderId === user.id;
                            const isSystem = msg.isSystem;

                            if (isSystem) {
                                return (
                                    <div key={i} className="flex justify-center my-4">
                                        <span className="bg-secondary/50 text-muted-foreground text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                                            {msg.text}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <img src={msg.senderAvatar} className="w-8 h-8 rounded-full bg-secondary object-cover" />
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                        {!isMe && <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.senderName}</span>}
                                        <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-muted-foreground mt-1 opacity-70">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border">
                        <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-2 px-4 border border-transparent focus-within:border-primary transition-colors">
                            <button type="button" className="text-muted-foreground hover:text-foreground hidden sm:block"><Plus size={20} /></button>
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Message..."
                                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <button type="button" className="text-muted-foreground hover:text-foreground hidden sm:block"><Smile size={20} /></button>
                            <button type="submit" disabled={!chatInput.trim()} className={`p-2 rounded-lg transition-all ${chatInput.trim() ? 'bg-primary text-white shadow-glow' : 'bg-transparent text-muted-foreground'}`}>
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </FadeIn>

                {/* MEMBER ROSTER */}
                <FadeIn delay={0.4} className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm h-full max-h-[400px] lg:max-h-[600px] lg:h-auto">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold text-lg text-foreground">Team Roster</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {teamMembers.map((member: any) => (
                            <div key={member.id} className="p-3 hover:bg-secondary/30 rounded-xl flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} className="w-10 h-10 rounded-full object-cover border border-border" />
                                        {/* Mock status indicator */}
                                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${Math.random() > 0.5 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-foreground">{member.name || member.email.split('@')[0]} {member.id === user.id ? <span className="text-xs text-muted-foreground">(You)</span> : ''}</div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase bg-secondary px-1.5 rounded">{member.role}</span>
                                            {member.status === 'INVITED' && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded">Invited</span>}
                                        </div>
                                    </div>
                                </div>
                                {(user.id === team.ownerId && member.id !== user.id) && (
                                    <button
                                        onClick={() => removeMember(member.id)}
                                        className="p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Kick Member"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}

                        {teamMembers.length === 0 && (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                No team members yet. Invite someone!
                            </div>
                        )}
                    </div>
                </FadeIn>
            </div>

            {/* Team Tasks (Duplicate of Workspace Tasks) */}
            <FadeIn delay={0.5}>
                <TasksTable
                    tasks={tasks}
                    projects={projects}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onAddTask={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                    onSelectTask={(task) => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                    title="Team Tasks"
                />
            </FadeIn>

            {/* Task Modal */}
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

            {/* Invite Modal */}
            {isInviting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsInviting(false)}>
                    <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 text-foreground">Invite to Squad</h3>
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
                            <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-glow">
                                Send Invite
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
