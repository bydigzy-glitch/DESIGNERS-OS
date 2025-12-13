-- DANGEROUS: THIS SCRIPT DELETES ALL DATA AND RECREATES THE SCHEMA
-- Run this to fix "relation does not exist" or "column does not exist" errors.
-- 1. DROP EVERYTHING (Clean Slate)
DROP TABLE IF EXISTS public.team_messages CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
-- 2. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 3. Create Users Table (Base)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'User',
    avatar TEXT,
    tokens INTEGER DEFAULT 50000,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
    ai_memory TEXT,
    team_id TEXT,
    -- Included natively now
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Create App Tables
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category TEXT DEFAULT 'WORK',
    priority TEXT DEFAULT 'MEDIUM',
    status_label TEXT DEFAULT 'Todo',
    duration INTEGER DEFAULT 30,
    completed BOOLEAN DEFAULT FALSE,
    color TEXT,
    project_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.clients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    revenue NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    notes TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.projects (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES public.clients(id) ON DELETE
    SET NULL,
        title TEXT NOT NULL,
        client_name TEXT DEFAULT '',
        status TEXT DEFAULT 'ACTIVE',
        price NUMERIC DEFAULT 0,
        progress INTEGER DEFAULT 0,
        tags TEXT [] DEFAULT '{}',
        color TEXT DEFAULT '#f97316',
        notes TEXT,
        deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.habits (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    completed_dates TEXT [] DEFAULT '{}',
    frequency TEXT DEFAULT 'DAILY',
    category TEXT DEFAULT 'WORK',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.chat_sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Create Team Tables
CREATE TABLE public.teams (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.team_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'VIEWER',
    status TEXT DEFAULT 'PENDING',
    avatar TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE public.team_messages (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_habits_user_id ON public.habits(user_id);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_messages_team_id ON public.team_messages(team_id);
-- 7. RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
-- 8. Policies
-- Users
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
-- Tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
-- Clients
CREATE POLICY "Users can view own clients" ON public.clients FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);
-- Projects
CREATE POLICY "Users can view own projects" ON public.projects FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
-- Habits
CREATE POLICY "Users can view own habits" ON public.habits FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);
-- Chat Sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);
-- Teams
CREATE POLICY "Users can view their teams" ON public.teams FOR
SELECT USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
                AND status = 'ACTIVE'
        )
    );
CREATE POLICY "Users can create teams" ON public.teams FOR
INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Team owners can update their teams" ON public.teams FOR
UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Team owners can delete their teams" ON public.teams FOR DELETE USING (owner_id = auth.uid());
-- Team Members
CREATE POLICY "Team members can view team members" ON public.team_members FOR
SELECT USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
        OR team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Team owners can manage members" ON public.team_members FOR
INSERT WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Team owners can update members" ON public.team_members FOR
UPDATE USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );
CREATE POLICY "Team owners can remove members" ON public.team_members FOR DELETE USING (
    team_id IN (
        SELECT id
        FROM public.teams
        WHERE owner_id = auth.uid()
    )
);
-- Team Messages
CREATE POLICY "Team members can view messages" ON public.team_messages FOR
SELECT USING (
        team_id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
                AND status = 'ACTIVE'
        )
        OR team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Team members can send messages" ON public.team_messages FOR
INSERT WITH CHECK (
        sender_id = auth.uid()
        AND (
            team_id IN (
                SELECT team_id
                FROM public.team_members
                WHERE user_id = auth.uid()
                    AND status = 'ACTIVE'
            )
            OR team_id IN (
                SELECT id
                FROM public.teams
                WHERE owner_id = auth.uid()
            )
        )
    );
-- 9. Trigger for New Users
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, name, avatar, tokens)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
        50000
    ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 10. Enable Realtime
-- We drop the publication first to ensure a clean state
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.tasks,
public.clients,
public.projects,
public.habits,
public.chat_sessions,
public.teams,
public.team_members,
public.team_messages;
-- 11. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;