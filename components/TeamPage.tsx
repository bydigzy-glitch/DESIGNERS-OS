
import React, { useState, useEffect, useRef } from 'react';
import { User, Task, Project, TeamMember, TeamMessage, Habit } from '../types';
import { Users, Plus, TrendingUp, Send, MoreVertical, Trash2, Mail, Flame, Smile, Layout, Calendar as CalendarIcon, CheckSquare, MessageSquare } from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { storageService, Backend } from '../services/storageService';
import { dbTeams, dbTeamMembers, dbTeamMessages, dbNotifications, subscribeToTeamMessages, subscribeToTeamMembers, db, supabase } from '../services/supabaseClient';
import { Calendar } from './Calendar';
import { TaskModal } from './modals/TaskModal';
import { TasksTable } from './common/TasksTable';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TeamPageProps {
    user: User;
    tasks: Task[];
    projects: Project[];
    habits: Habit[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: (task: Task) => void;
    onUpdateUser: (user: User) => void;
    onChangeColor: (taskId: string, color: string) => void;
    onAddTasks: (tasks: Task[]) => void;
}

// Internal Component: Team Habits Card (Real Data)
const TeamHabits: React.FC<{ habits: Habit[] }> = ({ habits }) => {
    const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
    const topHabits = habits.slice(0, 3);

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Flame size={20} className="text-orange-500" /> Team Momentum
            </h3>

            <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-black text-foreground">{totalStreak}</span>
                <span className="text-sm font-medium text-muted-foreground mb-1">combined streak days</span>
            </div>

            <div className="space-y-5 flex-1">
                {topHabits.length > 0 ? topHabits.map((h, i) => (
                    <div key={h.id}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-foreground">{h.title}</span>
                            <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
                                <Flame size={12} fill="currentColor" /> {h.streak}
                            </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                                style={{ width: `${Math.min((h.streak / 66) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-muted-foreground text-sm py-4">No active habits yet.</div>
                )}
            </div>
        </div>
    );
};

// Internal Component: Workload Card (New)
const TeamWorkload: React.FC<{ members: TeamMember[], tasks: Task[] }> = ({ members, tasks }) => {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Member Workload
            </h3>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                {members.map(m => {
                    const memberTasks = tasks.filter(t => t.assignedTo === m.id && !t.completed);
                    const count = memberTasks.length;
                    const highPri = memberTasks.filter(t => t.priority === 'HIGH').length;

                    return (
                        <div key={m.id} className="flex items-center gap-3">
                            <div className="relative">
                                <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`} className="w-8 h-8 rounded-full bg-secondary object-cover" />
                                {count > 5 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-card" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{m.name?.split(' ')[0] || m.email.split('@')[0]}</span>
                                    <span className="text-xs font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md">{count} Tasks</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < highPri ? 'bg-red-500' : 'bg-blue-400'}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Internal Component: Team Announcements (New)
const TeamAnnouncements: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={100} />
            </div>

            <div>
                <div className="flex items-center gap-2 mb-2 opacity-80">
                    <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Pinned</span>
                    <span className="text-xs">Just now</span>
                </div>
                <h3 className="text-xl font-bold leading-tight mb-2">Q4 Design Sprint</h3>
                <p className="text-indigo-100 text-sm opacity-90">
                    Team, please review assignments by EOD. Assignments updated.
                </p>
            </div>

            <button className="mt-4 w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm py-2 rounded-xl text-xs font-bold transition-colors">
                View Details
            </button>
        </div>
    );
}

export const TeamPage: React.FC<TeamPageProps> = ({
    user, tasks, projects, habits, onUpdateTask, onDeleteTask, onAddTask, onUpdateUser, onChangeColor, onAddTasks
}) => {
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [team, setTeam] = useState<any>(null); // Use robust Team type in real impl
    const [activeTab, setActiveTab] = useState<'CHAT' | 'CALENDAR' | 'PLANNER'>('CHAT');

    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load Team Data (Cloud-first with localStorage fallback)
    useEffect(() => {
        let messageUnsub: (() => void) | null = null;
        let memberUnsub: (() => void) | null = null;

        const loadTeam = async () => {
            if (!user.teamId) {
                setTeam(null);
                return;
            }

            // Try Supabase first for non-guest users
            if (!user.isGuest) {
                try {
                    const { data: teamData, error: teamError } = await dbTeams.get(user.teamId);
                    if (teamData && !teamError) {
                        const { data: members } = await dbTeamMembers.getByTeam(user.teamId);
                        const { data: messages } = await dbTeamMessages.getByTeam(user.teamId);

                        setTeam({
                            ...teamData,
                            members: (members || []).map((m: any) => ({
                                id: m.user_id || m.id,
                                email: m.email,
                                name: m.name,
                                role: m.role,
                                status: m.status,
                                avatar: m.avatar,
                            })),
                            messages: (messages || []).map((msg: any) => ({
                                id: msg.id,
                                senderId: msg.sender_id,
                                senderName: msg.sender_name,
                                senderAvatar: msg.sender_avatar,
                                text: msg.text,
                                timestamp: new Date(msg.created_at),
                                isSystem: msg.is_system,
                            }))
                        });

                        // Set up real-time subscriptions
                        messageUnsub = subscribeToTeamMessages(user.teamId, (payload: any) => {
                            const msg = payload.new;
                            setTeam(prev => prev ? {
                                ...prev,
                                messages: [...prev.messages, {
                                    id: msg.id,
                                    senderId: msg.sender_id,
                                    senderName: msg.sender_name,
                                    senderAvatar: msg.sender_avatar,
                                    text: msg.text,
                                    timestamp: new Date(msg.created_at),
                                    isSystem: msg.is_system,
                                }]
                            } : null);
                        });

                        memberUnsub = subscribeToTeamMembers(user.teamId, () => loadTeam());
                        return;
                    }
                } catch (e) {
                    console.log('[Team] Supabase load failed, using localStorage', e);
                }
            }

            // Fallback to localStorage
            const teamData = Backend.teams.get(user.teamId);
            if (teamData) {
                const allUsers = storageService.getUsers();
                const enrichedMembers = teamData.members.map((m: any) => {
                    const realUser = allUsers.find(u => u.id === m.id);
                    return realUser ? { ...m, lastSeen: realUser.lastSeen } : m;
                });
                setTeam({ ...teamData, members: enrichedMembers });
            }
        };

        loadTeam();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'designpreneur_teams' || e.key === 'designpreneur_users') {
                loadTeam();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            if (messageUnsub) messageUnsub();
            if (memberUnsub) memberUnsub();
        };
    }, [user.teamId, user.isGuest]);

    // Scroll to bottom of chat
    useEffect(() => {
        if (activeTab === 'CHAT') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [team?.messages, activeTab]);

    const handleCreateTeam = async () => {
        const name = `${user.name}'s Squad`;

        // Try Supabase first for non-guest users
        if (!user.isGuest) {
            try {
                const teamId = Date.now().toString();
                const { data, error } = await dbTeams.create({
                    id: teamId,
                    name,
                    owner_id: user.id
                });

                if (data && !error) {
                    // Add owner as first member
                    await dbTeamMembers.create({
                        team_id: teamId,
                        user_id: user.id,
                        email: user.email,
                        name: user.name,
                        role: 'ADMIN',
                        status: 'ACTIVE',
                        avatar: user.avatar
                    });

                    // Update user's team_id in Supabase
                    await db.users.upsert({ id: user.id, team_id: teamId } as any);

                    onUpdateUser({ ...user, teamId });
                    return;
                }
            } catch (e) {
                console.log('[Team] Supabase create failed, using localStorage', e);
            }
        }

        // Fallback to localStorage
        const newTeam = Backend.teams.create(user.id, name);
        onUpdateUser({ ...user, teamId: newTeam.id });
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim() || !team) return;

        // Try Supabase first for non-guest users
        if (!user.isGuest) {
            try {
                const { data, error } = await dbTeamMembers.create({
                    team_id: team.id,
                    email: newMemberEmail.trim().toLowerCase(),
                    role: 'VIEWER',
                    status: 'PENDING'
                });

                if (data && !error) {
                    // Find the invited user by email to create notification
                    try {
                        // Query to get the auth user ID by email using SQL
                        const { data: authUserData, error: authError } = await supabase.rpc('get_user_id_by_email', {
                            user_email: newMemberEmail.trim().toLowerCase()
                        });

                        if (authError) {
                            console.error('[Team] Failed to get user by email:', authError);
                            // Fallback: try public.users table
                            const { data: publicUser } = await supabase
                                .from('users')
                                .select('id')
                                .eq('email', newMemberEmail.trim().toLowerCase())
                                .single();

                            if (publicUser) {
                                await dbNotifications.create({
                                    user_id: publicUser.id,
                                    title: 'Team Invitation',
                                    message: `${user.name} invited you to join ${team.name}`,
                                    type: 'SYSTEM',
                                    read: false,
                                    action_type: 'TEAM_INVITE',
                                    team_id: team.id,
                                    team_name: team.name
                                });
                                console.log('[Team] Notification created for user from public.users');
                            }
                        } else if (authUserData) {
                            // Create notification using the auth user's ID
                            const notifResult = await dbNotifications.create({
                                user_id: authUserData,
                                title: 'Team Invitation',
                                message: `${user.name} invited you to join ${team.name}`,
                                type: 'SYSTEM',
                                read: false,
                                action_type: 'TEAM_INVITE',
                                team_id: team.id,
                                team_name: team.name
                            });

                            if (notifResult.error) {
                                console.error('[Team] Failed to create notification:', notifResult.error);
                            } else {
                                console.log('[Team] Notification created successfully');
                            }
                        }
                    } catch (notifError) {
                        console.error('[Team] Failed to create notification', notifError);
                    }

                    setTeam(prev => prev ? {
                        ...prev,
                        members: [...prev.members, {
                            id: data.id,
                            email: data.email,
                            role: data.role,
                            status: data.status
                        }]
                    } : null);
                    setNewMemberEmail('');
                    setIsInviting(false);
                    return;
                }
            } catch (e) {
                console.log('[Team] Supabase invite failed, using localStorage', e);
            }
        }

        // Fallback to localStorage
        const result = Backend.teams.invite(team.id, newMemberEmail, user.name);
        if (result.success) {
            const updatedTeam = Backend.teams.get(team.id);
            setTeam(updatedTeam);
            setNewMemberEmail('');
            setIsInviting(false);
        } else {
            alert(result.message);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || !team) return;

        const messageText = chatInput;
        setChatInput('');

        // Try Supabase first for non-guest users
        if (!user.isGuest) {
            try {
                const { data, error } = await dbTeamMessages.create({
                    team_id: team.id,
                    sender_id: user.id,
                    sender_name: user.name,
                    sender_avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    text: messageText,
                    is_system: false
                });

                if (data && !error) {
                    // Message will appear via real-time subscription
                    return;
                }
            } catch (e) {
                console.log('[Team] Supabase message failed, using localStorage', e);
            }
        }

        // Fallback to localStorage
        Backend.teams.sendMessage(team.id, user.id, messageText);
        const updatedTeam = Backend.teams.get(team.id);
        setTeam(updatedTeam);
    };

    const teamMembers = team ? team.members.filter((m: any) => m.status === 'ACTIVE') : [];
    const teamChat = team ? team.messages : [];

    // Calculate Online Status (Active in last 5 mins)
    const onlineThreshold = 5 * 60 * 1000;
    const isOnline = (isoDate?: string) => {
        if (!isoDate) return false;
        return (new Date().getTime() - new Date(isoDate).getTime()) < onlineThreshold;
    };
    const onlineMembersCount = teamMembers.filter((m: any) => isOnline(m.lastSeen) || m.id === user.id).length;

    if (!team) {
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
        <TooltipProvider delayDuration={300}>
            <div className="flex h-full w-full overflow-hidden bg-background">
                {/* LEFT SIDEBAR - MEMBERS & CHANNELS */}
                <div className="w-64 border-r border-border flex-col hidden md:flex bg-card/30 backdrop-blur-sm">
                    <div className="p-4 border-b border-border">
                        <h1 className="font-bold text-foreground text-lg truncate" title={team.name}>{team.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-muted-foreground">{onlineMembersCount} Online</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2">Channels</h3>
                            <div className="space-y-1">
                                {['General', 'Design', 'Engineering', 'Random'].map(c => (
                                    <button key={c} className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${c === 'General' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                                        # {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase px-2 mb-2 flex justify-between items-center">
                                Members <span className="bg-secondary px-1.5 rounded-md text-[10px] text-foreground">{teamMembers.length}</span>
                            </h3>
                            <div className="space-y-1">
                                {teamMembers.map((m: any) => {
                                    const online = isOnline(m.lastSeen) || m.id === user.id;
                                    return (
                                        <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors group">
                                            <div className="relative">
                                                <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.email}`} className="w-6 h-6 rounded-full bg-secondary object-cover" />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-card rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            </div>
                                            <span className="text-sm text-foreground truncate">{m.name || m.email.split('@')[0]}</span>
                                            {m.role === 'ADMIN' && <span className="text-[10px] text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity">Owner</span>}
                                        </div>
                                    )
                                })}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button onClick={() => setIsInviting(true)} className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-full">
                                            <Plus size={14} /> Invite People
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Add team members</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Mobile Header */}
                    <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
                        <h1 className="font-bold text-foreground">{team.name}</h1>
                        <button onClick={() => setIsInviting(true)} className="text-primary"><Plus size={20} /></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center border-b border-border px-4 bg-background z-10">
                        {[
                            { id: 'CHAT', label: 'Chat', icon: MessageSquare },
                            { id: 'CALENDAR', label: 'Calendar', icon: CalendarIcon },
                            { id: 'PLANNER', label: 'Planner', icon: CheckSquare },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden relative">
                        {/* CHAT TAB */}
                        {activeTab === 'CHAT' && (
                            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {teamChat.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <Users size={48} className="mb-2" />
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                    {teamChat.map((msg: any, i: number) => {
                                        const isMe = msg.senderId === user.id;
                                        if (msg.isSystem) return (
                                            <div key={i} className="flex justify-center my-4"><span className="bg-secondary/50 text-muted-foreground text-[10px] px-3 py-1 rounded-full uppercase font-bold">{msg.text}</span></div>
                                        );
                                        return (
                                            <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <img src={isMe ? (user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`) : msg.senderAvatar} className="w-8 h-8 rounded-full bg-secondary object-cover flex-shrink-0" />
                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                                    {!isMe && <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.senderName}</span>}
                                                    <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-secondary text-foreground rounded-tl-sm'}`}>{msg.text}</div>
                                                    <span className="text-[9px] text-muted-foreground mt-1 opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border">
                                    <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-2 px-4 border border-transparent focus-within:border-primary transition-colors">
                                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Message #${"General"}`} className="flex-1 bg-transparent text-foreground focus:outline-none py-1" />
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button type="submit" disabled={!chatInput.trim()} className="bg-primary text-primary-foreground p-1.5 rounded-lg disabled:opacity-50">
                                                    <Send size={16} />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Send message</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* CALENDAR TAB */}
                        {activeTab === 'CALENDAR' && (
                            <div className="h-full overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Calendar
                                    tasks={tasks}
                                    onUpdateTask={onUpdateTask}
                                    onDeleteTask={onDeleteTask}
                                    onAddTask={onAddTask}
                                    onChangeColor={onChangeColor}
                                    onAddTasks={onAddTasks}
                                />
                            </div>
                        )}

                        {/* PLANNER TAB */}
                        {activeTab === 'PLANNER' && (
                            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Top Row: Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-64">
                                    <TeamHabits habits={habits} />
                                    <TeamWorkload members={teamMembers} tasks={tasks} />
                                    <TeamAnnouncements />
                                </div>

                                {/* Detailed Tasks List */}
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-4">Team Tasks</h3>
                                    {/* Determine which tasks to show. Showing all user tasks for now as 'Team' context isn't fully separated yet */}
                                    <TasksTable
                                        tasks={tasks}
                                        teamMembers={teamMembers}
                                        projects={projects}
                                        onUpdateTask={onUpdateTask}
                                        onDeleteTask={onDeleteTask}
                                        onAddTask={() => { setSelectedTask(null); setIsTaskModalOpen(true); }}
                                        onSelectTask={(t) => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

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
                    teamMembers={teamMembers}
                />

                {isInviting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsInviting(false)}>
                        <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-4 text-foreground">Invite to Squad</h3>
                            <form onSubmit={handleInvite}>
                                <div className="relative mb-4">
                                    <input type="email" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="w-full bg-secondary border border-border rounded-xl p-3 pl-10 text-foreground text-sm focus:outline-none focus:border-primary" placeholder="colleague@brand.com" autoFocus required />
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                </div>
                                <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors shadow-glow">Send Invite</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
