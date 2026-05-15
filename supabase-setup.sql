-- FINAL COMPREHENSIVE SUPABASE SETUP
-- Copy and run this in your Supabase SQL Editor

-- 1. Ensure Profiles table has all necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS work TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create Follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    followed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, followed_id)
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Profiles (Ensure they are correct)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. Policies for Follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 6. Notifications table (Ensure types match)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert notifications." ON public.notifications;
CREATE POLICY "Anyone can insert notifications." ON public.notifications 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;
CREATE POLICY "Users can update their own notifications." ON public.notifications 
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Projects table (Ensure existing table has all columns)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS field TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS project_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lat FLOAT,
ADD COLUMN IF NOT EXISTS lng FLOAT;

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    sector TEXT,
    field TEXT,
    tags TEXT[] DEFAULT '{}',
    pdf_url TEXT,
    image_url TEXT,
    video_url TEXT,
    github_url TEXT,
    project_date DATE DEFAULT CURRENT_DATE,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    rating FLOAT DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    lat FLOAT,
    lng FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Project Interactions (Likes/Dislikes)
CREATE TABLE IF NOT EXISTS public.project_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    interaction_type TEXT CHECK (interaction_type IN ('like', 'dislike')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 9. Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, user_id)
);

-- 10. Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Enable RLS for all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 12. Policies for Projects
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
CREATE POLICY "Anyone can view projects" ON public.projects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects
    FOR DELETE USING (auth.uid() = student_id);

-- 13. Policies for Interactions
DROP POLICY IF EXISTS "Anyone can view interactions" ON public.project_interactions;
CREATE POLICY "Anyone can view interactions" ON public.project_interactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own interactions" ON public.project_interactions;
CREATE POLICY "Users can manage their own interactions" ON public.project_interactions
    FOR ALL USING (auth.uid() = user_id);

-- 14. Policies for Ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own ratings" ON public.ratings;
CREATE POLICY "Users can manage their own ratings" ON public.ratings
    FOR ALL USING (auth.uid() = user_id);

-- 15. Policies for Comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 16. RPC functions for interactions
-- Increment interaction count
CREATE OR REPLACE FUNCTION increment_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement interaction count
CREATE OR REPLACE FUNCTION decrement_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = GREATEST(0, COALESCE(%I, 0) - 1) WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Swap interaction (e.g. like to dislike)
CREATE OR REPLACE FUNCTION swap_interaction(target_project_id UUID, inc_column TEXT, dec_column TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = COALESCE(%I, 0) + 1, %I = GREATEST(0, COALESCE(%I, 0) - 1) WHERE id = $1', inc_column, inc_column, dec_column, dec_column)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Trigger the cache refresh
NOTIFY pgrst, 'reload schema';
