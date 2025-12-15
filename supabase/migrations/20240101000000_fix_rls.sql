-- Fix RLS policies for Tasks to ensure users can only see their own data
-- But allow full access for the authenticated user to their own rows
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
-- Re-create stricter policies
CREATE POLICY "Users can view own tasks" ON public.tasks FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);
-- Ensure RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;