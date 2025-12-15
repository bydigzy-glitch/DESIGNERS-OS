-- Create function to get user ID by email from auth.users
-- This allows the application to look up auth user IDs by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(user_email TEXT) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE user_uuid UUID;
BEGIN
SELECT id INTO user_uuid
FROM auth.users
WHERE email = user_email
LIMIT 1;
RETURN user_uuid;
END;
$$;