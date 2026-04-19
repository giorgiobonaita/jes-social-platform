-- ============================================================
-- JES — FIX RAPIDO (solo quello che manca)
-- Incolla tutto nel SQL Editor di Supabase e clicca Run
-- ============================================================

-- 1. COLONNE NUOVE
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality        TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS accepts_promotions BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS categories         TEXT[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_urls         TEXT[];
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id  UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read       BOOLEAN DEFAULT false;

-- 2. ABILITA RLS (sicurezza)
ALTER TABLE public.follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;

-- 3. POLICY (drop + crea — sicuro)

-- USERS
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (auth.uid() = auth_id);

-- POSTS
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (true);

-- STORIES
DROP POLICY IF EXISTS "stories_select" ON public.stories;
DROP POLICY IF EXISTS "stories_insert" ON public.stories;
DROP POLICY IF EXISTS "stories_delete" ON public.stories;
CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (true);

-- LIKES
DROP POLICY IF EXISTS "likes_select" ON public.likes;
DROP POLICY IF EXISTS "likes_insert" ON public.likes;
DROP POLICY IF EXISTS "likes_delete" ON public.likes;
CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON public.likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete" ON public.likes FOR DELETE USING (true);

-- FOLLOWS
DROP POLICY IF EXISTS "follows_select" ON public.follows;
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
DROP POLICY IF EXISTS "follows_delete" ON public.follows;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "notif_insert" ON public.notifications;
DROP POLICY IF EXISTS "notif_update" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (true);

-- SAVES
DROP POLICY IF EXISTS "saves_select" ON public.saves;
DROP POLICY IF EXISTS "saves_insert" ON public.saves;
DROP POLICY IF EXISTS "saves_delete" ON public.saves;
CREATE POLICY "saves_select" ON public.saves FOR SELECT USING (true);
CREATE POLICY "saves_insert" ON public.saves FOR INSERT WITH CHECK (true);
CREATE POLICY "saves_delete" ON public.saves FOR DELETE USING (true);

-- POST TAGS
DROP POLICY IF EXISTS "tags_select" ON public.post_tags;
DROP POLICY IF EXISTS "tags_insert" ON public.post_tags;
CREATE POLICY "tags_select" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON public.post_tags FOR INSERT WITH CHECK (true);

-- GROUPS
DROP POLICY IF EXISTS "groups_select" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT WITH CHECK (true);

-- GROUP MEMBERS
DROP POLICY IF EXISTS "gm_select" ON public.group_members;
DROP POLICY IF EXISTS "gm_insert" ON public.group_members;
DROP POLICY IF EXISTS "gm_delete" ON public.group_members;
CREATE POLICY "gm_select" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "gm_delete" ON public.group_members FOR DELETE USING (true);

-- MESSAGES
DROP POLICY IF EXISTS "msg_select" ON public.messages;
DROP POLICY IF EXISTS "msg_insert" ON public.messages;
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (true);

-- 4. STORAGE — rendi il bucket "media" pubblico
INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "media_read"  ON storage.objects;
DROP POLICY IF EXISTS "media_write" ON storage.objects;
CREATE POLICY "media_read"  ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- 5. GRUPPI UFFICIALI (senza ON CONFLICT su name)
INSERT INTO public.groups (name, is_private)
SELECT name, false FROM (VALUES
  ('Pittura'), ('Scultura'), ('Letteratura'), ('Fotografia'),
  ('Cucina Chef'), ('Tattoo'), ('Design'), ('Architettura'),
  ('Archeologia'), ('Storia'), ('Recitazione e Danza'), ('Musica'),
  ('Fumettistica'), ('Arte di Strada'), ('Partner'),
  ('Moda / Fashion'), ('Sponsor')
) AS g(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.groups WHERE groups.name = g.name
);

-- FINE
