import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL  = 'https://cunftokrdqvprepcnlum.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4';

// AsyncStorage solo su dispositivo nativo (non in SSR/Node.js)
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AsyncStorage = isNative ? require('@react-native-async-storage/async-storage').default : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   isNative,
    persistSession:     isNative,
    detectSessionInUrl: false,
  },
});

// Username dell'account ufficiale JES (unico account verificato)
// Per creare l'account: INSERT INTO users (username, name, role) VALUES ('jes_official', 'JES', 'admin')
export const JES_OFFICIAL_USERNAME = 'jes_official';

// ── Tipi che rispecchiano lo schema SQL ──────────────────────────────────────

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
  users?:       DbUser;          // join
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
