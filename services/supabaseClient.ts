import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xcunrqfrxbfgdcqzfecv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdW5ycWZyeGJmZ2RjcXpmZWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MDczMTYsImV4cCI6MjA4MTA4MzMxNn0.WgphgxJ-KVT6dD-t6-hKnsR9tTARBYaaJihwZjwgww8';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbUser {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    tokens: number;
    preferences: Record<string, unknown>;
    ai_memory?: string;
    created_at: string;
}

export interface DbTask {
    id: string;
    user_id: string;
    title: string;
    date: string;
    category: string;
    priority: string;
    status_label: string;
    duration: number;
    completed: boolean;
    color?: string;
    project_id?: string;
    notes?: string;
    created_at: string;
}

export interface DbClient {
    id: string;
    user_id: string;
    name: string;
    email?: string;
    revenue: number;
    status: string;
    notes?: string;
    avatar?: string;
    created_at: string;
}

export interface DbProject {
    id: string;
    user_id: string;
    client_id?: string;
    title: string;
    client_name: string;
    status: string;
    price: number;
    progress: number;
    tags: string[];
    color: string;
    notes?: string;
    deadline?: string;
    created_at: string;
}

export interface DbHabit {
    id: string;
    user_id: string;
    title: string;
    streak: number;
    completed_dates: string[];
    frequency: string;
    category: string;
    created_at: string;
}

export interface DbChatSession {
    id: string;
    user_id: string;
    title: string;
    messages: Array<{
        id: string;
        role: 'user' | 'model';
        text: string;
        timestamp: string;
    }>;
    created_at: string;
    last_modified: string;
}

// Auth helpers
export const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });
    return { data, error };
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const onAuthStateChange = (callback: (event: string, session: unknown) => void) => {
    return supabase.auth.onAuthStateChange(callback);
};

// Database helpers
export const db = {
    // Users
    users: {
        get: async (userId: string) => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            return { data, error };
        },
        upsert: async (user: Partial<DbUser> & { id: string }) => {
            const { data, error } = await supabase
                .from('users')
                .upsert(user)
                .select()
                .single();
            return { data, error };
        }
    },

    // Tasks
    tasks: {
        getAll: async (userId: string) => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: true });
            return { data: data || [], error };
        },
        create: async (task: Omit<DbTask, 'created_at'>) => {
            const { data, error } = await supabase
                .from('tasks')
                .insert(task)
                .select()
                .single();
            return { data, error };
        },
        update: async (id: string, updates: Partial<DbTask>) => {
            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);
            return { error };
        }
    },

    // Clients
    clients: {
        getAll: async (userId: string) => {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', userId)
                .order('name', { ascending: true });
            return { data: data || [], error };
        },
        create: async (client: Omit<DbClient, 'created_at'>) => {
            const { data, error } = await supabase
                .from('clients')
                .insert(client)
                .select()
                .single();
            return { data, error };
        },
        update: async (id: string, updates: Partial<DbClient>) => {
            const { data, error } = await supabase
                .from('clients')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);
            return { error };
        }
    },

    // Projects
    projects: {
        getAll: async (userId: string) => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return { data: data || [], error };
        },
        create: async (project: Omit<DbProject, 'created_at'>) => {
            const { data, error } = await supabase
                .from('projects')
                .insert(project)
                .select()
                .single();
            return { data, error };
        },
        update: async (id: string, updates: Partial<DbProject>) => {
            const { data, error } = await supabase
                .from('projects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            return { error };
        }
    },

    // Habits
    habits: {
        getAll: async (userId: string) => {
            const { data, error } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });
            return { data: data || [], error };
        },
        create: async (habit: Omit<DbHabit, 'created_at'>) => {
            const { data, error } = await supabase
                .from('habits')
                .insert(habit)
                .select()
                .single();
            return { data, error };
        },
        update: async (id: string, updates: Partial<DbHabit>) => {
            const { data, error } = await supabase
                .from('habits')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', id);
            return { error };
        }
    },

    // Chat Sessions
    chatSessions: {
        getAll: async (userId: string) => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('last_modified', { ascending: false });
            return { data: data || [], error };
        },
        create: async (session: Omit<DbChatSession, 'created_at'>) => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert(session)
                .select()
                .single();
            return { data, error };
        },
        update: async (id: string, updates: Partial<DbChatSession>) => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            return { data, error };
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', id);
            return { error };
        }
    }
};

// Real-time subscriptions
export const subscribeToChanges = (
    userId: string,
    onTaskChange: (payload: unknown) => void,
    onClientChange: (payload: unknown) => void,
    onProjectChange: (payload: unknown) => void,
    onHabitChange: (payload: unknown) => void
) => {
    const tasksSub = supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` }, onTaskChange)
        .subscribe();

    const clientsSub = supabase
        .channel('clients-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `user_id=eq.${userId}` }, onClientChange)
        .subscribe();

    const projectsSub = supabase
        .channel('projects-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, onProjectChange)
        .subscribe();

    const habitsSub = supabase
        .channel('habits-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` }, onHabitChange)
        .subscribe();

    return () => {
        tasksSub.unsubscribe();
        clientsSub.unsubscribe();
        projectsSub.unsubscribe();
        habitsSub.unsubscribe();
    };
};

// =====================================================
// TEAMS DATABASE OPERATIONS
// =====================================================

export interface DbTeam {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export interface DbTeamMember {
    id: string;
    team_id: string;
    user_id?: string;
    email: string;
    name?: string;
    role: string;
    status: string;
    avatar?: string;
    joined_at: string;
}

export interface DbTeamMessage {
    id: string;
    team_id: string;
    sender_id: string;
    sender_name?: string;
    sender_avatar?: string;
    text: string;
    is_system: boolean;
    created_at: string;
}

export const dbTeams = {
    // Get user's team
    get: async (teamId: string) => {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single();
        return { data, error };
    },

    // Get team by owner
    getByOwner: async (ownerId: string) => {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .eq('owner_id', ownerId);
        return { data: data || [], error };
    },

    // Create team
    create: async (team: Omit<DbTeam, 'created_at'>) => {
        const { data, error } = await supabase
            .from('teams')
            .insert(team)
            .select()
            .single();
        return { data, error };
    },

    // Update team
    update: async (id: string, updates: Partial<DbTeam>) => {
        const { data, error } = await supabase
            .from('teams')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Delete team
    delete: async (id: string) => {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id);
        return { error };
    }
};

export const dbTeamMembers = {
    // Get team members
    getByTeam: async (teamId: string) => {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .order('joined_at', { ascending: true });
        return { data: data || [], error };
    },

    // Get user's team membership
    getByUser: async (userId: string) => {
        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'ACTIVE');
        return { data: data || [], error };
    },

    // Add member
    create: async (member: Omit<DbTeamMember, 'id' | 'joined_at'>) => {
        const { data, error } = await supabase
            .from('team_members')
            .insert(member)
            .select()
            .single();
        return { data, error };
    },

    // Update member status
    update: async (id: string, updates: Partial<DbTeamMember>) => {
        const { data, error } = await supabase
            .from('team_members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Remove member
    delete: async (id: string) => {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);
        return { error };
    }
};

export const dbTeamMessages = {
    // Get team messages
    getByTeam: async (teamId: string, limit: number = 100) => {
        const { data, error } = await supabase
            .from('team_messages')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true })
            .limit(limit);
        return { data: data || [], error };
    },

    // Send message
    create: async (message: Omit<DbTeamMessage, 'id' | 'created_at'>) => {
        const { data, error } = await supabase
            .from('team_messages')
            .insert(message)
            .select()
            .single();
        return { data, error };
    }
};

// Subscribe to team messages (real-time)
export const subscribeToTeamMessages = (
    teamId: string,
    onMessage: (payload: any) => void
) => {
    const channel = supabase
        .channel(`team-messages-${teamId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'team_messages',
            filter: `team_id=eq.${teamId}`
        }, onMessage)
        .subscribe();

    return () => channel.unsubscribe();
};

// Subscribe to team member changes (for invites/joins)
export const subscribeToTeamMembers = (
    teamId: string,
    onMemberChange: (payload: any) => void
) => {
    const channel = supabase
        .channel(`team-members-${teamId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'team_members',
            filter: `team_id=eq.${teamId}`
        }, onMemberChange)
        .subscribe();

    return () => channel.unsubscribe();
};

