-- "FIX EVERYTHING" SCHEMA SCRIPT (CORRECTED v3)
-- Run this script to completely repair your database state.
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 2. Create Users Table (The Foundation)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'User',
    avatar TEXT,
    tokens INTEGER DEFAULT 50000,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
    ai_memory TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Add team_id to users (Safe Addition)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS team_id TEXT;
-- 4. Create All Other Tables
CREATE TABLE IF NOT EXISTS public.tasks (
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
CREATE TABLE IF NOT EXISTS public.clients (
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
CREATE TABLE IF NOT EXISTS public.projects (
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
CREATE TABLE IF NOT EXISTS public.habits (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    completed_dates TEXT [] DEFAULT '{}',
    frequency TEXT DEFAULT 'DAILY',
    category TEXT DEFAULT 'WORK',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Chat',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Create Team Tables
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.team_members (
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
CREATE TABLE IF NOT EXISTS public.team_messages (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Recreate Indexes (Safe drops then creates)
DROP INDEX IF EXISTS idx_tasks_user_id;
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
DROP INDEX IF EXISTS idx_team_members_team_id;
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
DROP INDEX IF EXISTS idx_team_messages_team_id;
CREATE INDEX idx_team_messages_team_id ON public.team_messages(team_id);
-- 7. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
-- 8. Apply Policies
-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR
UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
-- Teams
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
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
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams FOR
INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
CREATE POLICY "Team owners can update their teams" ON public.teams FOR
UPDATE USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
CREATE POLICY "Team owners can delete their teams" ON public.teams FOR DELETE USING (owner_id = auth.uid());
-- Team Members
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
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
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;
CREATE POLICY "Team owners can manage members" ON public.team_members FOR
INSERT WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
    );
-- Team Messages
DROP POLICY IF EXISTS "Team members can view messages" ON public.team_messages;
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
DROP POLICY IF EXISTS "Team members can send messages" ON public.team_messages;
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
-- 9. Setup Triggers
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
-- 10. Enable Realtime (Ignore Errors)
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.tasks;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.clients;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.projects;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.habits;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.chat_sessions;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.teams;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.team_members;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.team_messages;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- 11. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;