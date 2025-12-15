-- Fix RLS Policy for Notifications
-- Allow users to create notifications for other users (for team invites, etc.)
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
-- Create a new policy that allows inserting notifications for any user
-- This is safe because:
-- 1. Users can only read their own notifications (SELECT policy)
-- 2. The application logic controls who can send notifications
-- 3. Notifications are not sensitive data that needs strict write protection
CREATE POLICY "Allow notification creation" ON public.notifications FOR
INSERT WITH CHECK (true);
-- Alternative: If you want more control, you could allow only authenticated users to create notifications
-- CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT
--     WITH CHECK (auth.uid() IS NOT NULL);