-- Update the trigger function to handle new fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
user_count int;
user_email text;
BEGIN
SELECT COUNT(*) INTO user_count FROM profiles;

-- Extract email from raw_user_meta_data if available
user_email := NEW.raw_user_meta_data->>'email';

-- If email is null or contains @miaoda.com, set to null
IF user_email IS NULL OR user_email LIKE '%@miaoda.com' THEN
  user_email := NULL;
END IF;

-- Insert a profile synced with fields collected at signup
INSERT INTO public.profiles (id, email, username, role)
VALUES (
  NEW.id,
  COALESCE(user_email, NEW.email),
  COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
  CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
);

RETURN NEW;
END;
$$;