import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const createMockClient = () => {
  const errorMessage = 'Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables (e.g. in Vercel project settings).';
  console.warn(errorMessage);
  const mockResult = { data: null, error: { message: errorMessage } };
  const mockPromise = Promise.resolve(mockResult);
  
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    range: () => mockPromise,
    single: () => mockPromise,
    maybeSingle: () => mockPromise,
    not: () => mockPromise,
    insert: () => mockPromise,
    update: () => mockQueryBuilder,
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
      signInWithPassword: async () => ({ error: { message: errorMessage } }),
      signUp: async () => ({ error: { message: errorMessage } }),
      signInWithOAuth: async () => ({ error: { message: errorMessage } }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => mockQueryBuilder,
    channel: () => ({
      on: () => ({
        subscribe: () => ({ unsubscribe: () => {} })
      })
    }),
    rpc: () => mockPromise,
    storage: {
      from: () => ({
        upload: async () => mockResult,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      })
    }
  } as any;
};

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.length > 10)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

export type Project = {
  id: string;
  title: string;
  description: string;
  student_id: string;
  student_name: string;
  created_at: string;
  category: string;
  tags: string[];
  image_url?: string;
  pdf_url?: string;
  project_date?: string;
  video_url?: string;
  github_url?: string;
  likes: number;
  dislikes: number;
  rating: number;
  rating_count: number;
  comments_count: number;
  lat?: number;
  lng?: number;
};

export type Comment = {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  phone?: string;
  bio?: string;
};
