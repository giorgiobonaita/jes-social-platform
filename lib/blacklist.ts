import { supabase } from './supabase';

let cachedWords: string[] = [];
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

export async function getBlacklistWords(): Promise<string[]> {
  if (Date.now() - cacheTime < CACHE_TTL && cachedWords.length > 0) {
    return cachedWords;
  }
  const { data } = await supabase.from('blacklist_words').select('word');
  cachedWords = (data || []).map((r: any) => r.word.toLowerCase());
  cacheTime = Date.now();
  return cachedWords;
}

export async function containsBlacklistedWord(text: string): Promise<string | null> {
  if (!text.trim()) return null;
  const words = await getBlacklistWords();
  const lower = text.toLowerCase();
  for (const w of words) {
    if (lower.includes(w)) return w;
  }
  return null;
}
