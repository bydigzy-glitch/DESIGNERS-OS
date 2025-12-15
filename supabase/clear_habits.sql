-- Clear all existing habits and start fresh
-- This will fix the issue with old habits not syncing properly
-- Delete all habits for your account
DELETE FROM habits
WHERE user_id = (
        SELECT id
        FROM auth.users
        WHERE email = 'bydigzy@gmail.com'
    );
-- Verify they're deleted
SELECT COUNT(*) as remaining_habits
FROM habits
WHERE user_id = (
        SELECT id
        FROM auth.users
        WHERE email = 'bydigzy@gmail.com'
    );
-- This should return 0 remaining_habits