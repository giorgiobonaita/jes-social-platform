import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://cunftokrdqvprepcnlum.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export const JES_OFFICIAL_USERNAME = 'jes_official';

export interface DbUser {
  id:          string;
  auth_id:     string | null;
  username:    string;
  name:        string;
  bio:         string | null;
  avatar_url:  string | null;
  discipline:  string | null;
  role:        string | null;
  created_at:  string;
  updated_at:  string;
}

export interface DbPost {
  id:           string;
  user_id:      string;
  caption:      string | null;
  image_url:    string | null;
  aspect_ratio: number;
  privacy:      'all' | 'follow' | 'close' | 'me';
  group_id:     string | null;
  group_name:   string | null;
  created_at:   string;
  users?:       DbUser;
  post_tags?:   { tag: string }[];
  likes?:       { count: number }[];
  comments?:    { count: number }[];
}

export interface DbStory {
  id:         string;
  user_id:    string;
  image_url:  string;
  link_url:   string | null;
  mention:    string | null;
  privacy:    'all' | 'close' | 'me';
  expires_at: string;
  created_at: string;
  users?:     DbUser;
}
