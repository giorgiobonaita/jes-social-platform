import { supabase } from './supabase';

/**
 * DB Client abstraction layer.
 * Questo file "nasconde" l'uso diretto di Supabase alle pagine React.
 * Se in futuro vorrai cambiare backend (es. passaggio a un nuovo server Postgres),
 * dovrai cambiare il codice solo all'interno di questo file.
 */
export const db = {
  // ─── AUTH & USER INFO ────────────────────────────────────────────────────────

  /** Controlla la sessione attuale */
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /** Ritorna l'utente corrente completo dal DB pubblico */
  getCurrentDbUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('users').select('*').eq('auth_id', user.id).single();
    if (error) throw error;
    return data;
  },

  // ─── FEED & POSTS ────────────────────────────────────────────────────────────

  /** Ottiene i post per il feed, gestendo l'assenza dei soft-deleted e bannati (se richiesto) */
  getFeedPosts: async (limit: number = 50) => {
    // Escludiamo post eliminati logicamente se decideremo di usare is_deleted
    // Attualmente la tua tabella non lo ha esplicitamente come default, ma possiamo filtrare.
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return posts;
  },

  /** Pubblica un post (supporto per multi foto) */
  createPost: async (userId: string, content: string, imageUrls: string[]) => {
    const { data, error } = await supabase.from('posts').insert([
      { 
        user_id: userId, 
        caption: content, 
        image_urls: imageUrls, // l'array multi-img
        image_url: imageUrls[0] || null // per retrocompatibilità
      }
    ]).select().single();
    if (error) throw error;
    return data;
  },

  /** Elimina un post fisicamente o tramite soft-delete o tramite Admin */
  deletePost: async (postId: string) => {
    // Opzione 1: Delete Fisico. L'Admin può farlo se ha privilegi o se è l'autore.
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
    return true;
  },

  // ─── ADMIN TOOLS ─────────────────────────────────────────────────────────────

  banUser: async (userId: string) => {
    const { error } = await supabase.from('users').update({ is_banned: true }).eq('id', userId);
    if (error) throw error;
    return true;
  },

  makeAdmin: async (userId: string) => {
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
    if (error) throw error;
    return true;
  }
};
