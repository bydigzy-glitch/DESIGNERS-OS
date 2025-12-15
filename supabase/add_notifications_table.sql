-- Add Notifications Table to Supabase
-- This allows notifications to be synced across devices
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    -- INFO, WARNING, SUCCESS, SYSTEM
    read BOOLEAN DEFAULT FALSE,
    action_type TEXT,
    -- TEAM_INVITE, CHAT_MESSAGE, DEADLINE, ROLE_ASSIGNMENT, TASK_MODAL
    team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE,
    team_name TEXT,
    task_id TEXT,
    task_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- Enable realtime for notifications
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.notifications;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;