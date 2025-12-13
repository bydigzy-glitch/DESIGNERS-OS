-- Migration: Add Teams System to Existing Database
-- Run this if you already have the base tables (users, tasks, etc.)
-- Step 1: Add team_id column to existing users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS team_id TEXT;
-- Step 2: Create Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Step 3: Create Team members table  
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
-- Step 4: Create Team messages table
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
-- Step 5: Create indexes for team queries
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON public.team_messages(team_id);
-- Step 6: Enable RLS on team tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
-- Step 7: RLS Policies for teams
DO $$ BEGIN CREATE POLICY "Users can view their teams" ON public.teams FOR
SELECT USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT team_id
            FROM public.team_members
            WHERE user_id = auth.uid()
                AND status = 'ACTIVE'
        )
    );
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Users can create teams" ON public.teams FOR
INSERT WITH CHECK (owner_id = auth.uid());
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team owners can update their teams" ON public.teams FOR
UPDATE USING (owner_id = auth.uid());
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team owners can delete their teams" ON public.teams FOR DELETE USING (owner_id = auth.uid());
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- Step 8: RLS Policies for team members
DO $$ BEGIN CREATE POLICY "Team members can view team members" ON public.team_members FOR
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
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team owners can manage members" ON public.team_members FOR
INSERT WITH CHECK (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
    );
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team owners can update members" ON public.team_members FOR
UPDATE USING (
        team_id IN (
            SELECT id
            FROM public.teams
            WHERE owner_id = auth.uid()
        )
        OR user_id = auth.uid()
    );
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team owners can remove members" ON public.team_members FOR DELETE USING (
    team_id IN (
        SELECT id
        FROM public.teams
        WHERE owner_id = auth.uid()
    )
);
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- Step 9: RLS Policies for team messages
DO $$ BEGIN CREATE POLICY "Team members can view messages" ON public.team_messages FOR
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
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN CREATE POLICY "Team members can send messages" ON public.team_messages FOR
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
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- Step 10: Enable realtime for team tables
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