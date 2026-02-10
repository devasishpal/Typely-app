-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create lesson difficulty enum
CREATE TYPE public.lesson_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create lesson category enum
CREATE TYPE public.lesson_category AS ENUM ('home_row', 'top_row', 'bottom_row', 'numbers', 'special_chars', 'punctuation', 'combination');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.lesson_category NOT NULL,
  difficulty public.lesson_difficulty NOT NULL DEFAULT 'beginner'::public.lesson_difficulty,
  order_index integer NOT NULL,
  content text NOT NULL,
  target_keys text[] NOT NULL,
  finger_guidance jsonb,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create lesson_progress table
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  best_wpm integer,
  best_accuracy numeric(5,2),
  attempts integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create typing_sessions table
CREATE TABLE public.typing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  wpm integer NOT NULL,
  cpm integer NOT NULL,
  accuracy numeric(5,2) NOT NULL,
  total_keystrokes integer NOT NULL,
  correct_keystrokes integer NOT NULL,
  incorrect_keystrokes integer NOT NULL,
  backspace_count integer NOT NULL DEFAULT 0,
  error_keys jsonb,
  duration_seconds integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create typing_tests table
CREATE TABLE public.typing_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  test_content text NOT NULL,
  wpm integer NOT NULL,
  cpm integer NOT NULL,
  accuracy numeric(5,2) NOT NULL,
  total_keystrokes integer NOT NULL,
  correct_keystrokes integer NOT NULL,
  incorrect_keystrokes integer NOT NULL,
  backspace_count integer NOT NULL DEFAULT 0,
  error_keys jsonb,
  duration_seconds integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  badge_color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create statistics table (aggregated user stats)
CREATE TABLE public.statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_sessions integer NOT NULL DEFAULT 0,
  total_keystrokes integer NOT NULL DEFAULT 0,
  total_duration_seconds integer NOT NULL DEFAULT 0,
  average_wpm numeric(6,2),
  average_accuracy numeric(5,2),
  lessons_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX idx_typing_sessions_user_id ON public.typing_sessions(user_id);
CREATE INDEX idx_typing_sessions_created_at ON public.typing_sessions(created_at DESC);
CREATE INDEX idx_typing_tests_user_id ON public.typing_tests(user_id);
CREATE INDEX idx_typing_tests_created_at ON public.typing_tests(created_at DESC);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_statistics_user_id ON public.statistics(user_id);
CREATE INDEX idx_statistics_date ON public.statistics(date DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- Create function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  new_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Extract username from email (before @)
  new_username := split_part(NEW.email, '@', 1);
  
  -- Insert a profile synced with fields collected at signup
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- Lessons policies (public read, admin write)
CREATE POLICY "Anyone can view lessons" ON lessons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Lesson progress policies
CREATE POLICY "Users can view their own progress" ON lesson_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON lesson_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON lesson_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON lesson_progress
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Typing sessions policies
CREATE POLICY "Users can view their own sessions" ON typing_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON typing_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON typing_sessions
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Typing tests policies
CREATE POLICY "Users can view their own tests" ON typing_tests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tests" ON typing_tests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tests" ON typing_tests
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Achievements policies (public read, admin write)
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage achievements" ON achievements
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements" ON user_achievements
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Statistics policies
CREATE POLICY "Users can view their own statistics" ON statistics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own statistics" ON statistics
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statistics" ON statistics
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Create public view for shareable profile info
CREATE VIEW public_profiles AS
  SELECT id, username, avatar_url, role FROM profiles;