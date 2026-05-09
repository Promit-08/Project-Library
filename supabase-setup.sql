/* 
  COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
  1. Go to your Supabase Dashboard
  2. Click on 'SQL Editor' in the left sidebar
  3. Click 'New query'
  4. Paste this code and click 'Run'
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
BEGIN;
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
  CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
  CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
  CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
COMMIT;

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  student_id UUID REFERENCES auth.users ON DELETE CASCADE,
  student_name TEXT,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  video_url TEXT,
  github_url TEXT,
  pdf_url TEXT,
  project_date DATE,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  rating FLOAT DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  lat FLOAT,
  lng FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- Receiver of the notification
  actor_id UUID REFERENCES auth.users ON DELETE CASCADE, -- Person who performed the action
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  type TEXT CHECK (type IN ('like', 'dislike', 'comment', 'rating')),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Policies for notifications
BEGIN;
  DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
  CREATE POLICY "Users can view their own notifications." ON public.notifications FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own notifications (read status)." ON public.notifications;
  CREATE POLICY "Users can update their own notifications (read status)." ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "System/Users can insert notifications." ON public.notifications;
  CREATE POLICY "System/Users can insert notifications." ON public.notifications FOR INSERT WITH CHECK (true);
COMMIT;

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  user_name TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ratings table (to prevent double rating)
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(project_id, user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Project likes tracking (optional, but good for persistence)
CREATE TABLE IF NOT EXISTS public.project_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('like', 'dislike')),
  UNIQUE(project_id, user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for new tables
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for comments
BEGIN;
  DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
  CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert their own comments." ON public.comments;
  CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete their own comments." ON public.comments;
  CREATE POLICY "Users can delete their own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);
COMMIT;

-- Policies for ratings
BEGIN;
  DROP POLICY IF EXISTS "Ratings are viewable by everyone." ON public.ratings;
  CREATE POLICY "Ratings are viewable by everyone." ON public.ratings FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert their own ratings." ON public.ratings;
  CREATE POLICY "Users can insert their own ratings." ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own ratings." ON public.ratings;
  CREATE POLICY "Users can update their own ratings." ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
COMMIT;

-- Policies for interactions
BEGIN;
  DROP POLICY IF EXISTS "Interactions are viewable by everyone." ON public.project_interactions;
  CREATE POLICY "Interactions are viewable by everyone." ON public.project_interactions FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert/update their own interactions." ON public.project_interactions;
  CREATE POLICY "Users can insert/update their own interactions." ON public.project_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete their own interactions." ON public.project_interactions;
  CREATE POLICY "Users can delete their own interactions." ON public.project_interactions FOR DELETE USING (auth.uid() = user_id);
COMMIT;

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RPC HELPERS FOR INTERACTIONS
-- These functions update counts atomically on the server

-- Increment interaction count
CREATE OR REPLACE FUNCTION public.increment_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = %I + 1 WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement interaction count
CREATE OR REPLACE FUNCTION public.decrement_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = GREATEST(0, %I - 1) WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Swap interaction (e.g. like to dislike)
CREATE OR REPLACE FUNCTION public.swap_interaction(target_project_id UUID, inc_column TEXT, dec_column TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = %I + 1, %I = GREATEST(0, %I - 1) WHERE id = $1', inc_column, inc_column, dec_column, dec_column)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for projects
BEGIN;
  DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.projects;
  CREATE POLICY "Projects are viewable by everyone." ON public.projects
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert their own projects." ON public.projects;
  CREATE POLICY "Users can insert their own projects." ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = student_id);

  DROP POLICY IF EXISTS "Users can update own projects." ON public.projects;
  CREATE POLICY "Users can update own projects." ON public.projects
    FOR UPDATE USING (auth.uid() = student_id);
COMMIT;

-- Helper to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

/*
  STORAGE SETUP:
  1. Go to 'Storage' in the Supabase Sidebar
  2. Create NEW BUCKETS called 'avatars' and 'projects'
  3. Set them both to 'Public'
  4. Under 'Policies' for both buckets, add these rules:
     - Policy 1: 'Public Access' -> SELECT -> Target: Everyone
     - Policy 2: 'Allow individual uploads' -> INSERT/UPDATE -> Target: Authenticated -> Check: (bucket_id IN ('avatars', 'projects'))
*/
