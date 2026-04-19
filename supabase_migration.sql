-- ============================================================
-- JES Social — MIGRAZIONE (per DB già esistenti)
-- Sicuro da eseguire anche se le tabelle esistono già.
-- ============================================================

-- ============================================================
-- 1. CREA TABELLE MANCANTI (skip se esistono già)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id             UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT UNIQUE,
  name                TEXT,
  bio                 TEXT,
  avatar_url          TEXT,
  discipline          TEXT,
  role                TEXT DEFAULT 'user',
  is_banned           BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  caption      TEXT,
  image_url    TEXT,
  image_urls   TEXT[],
  aspect_ratio FLOAT DEFAULT 1,
  privacy      TEXT DEFAULT 'all',
  group_id     UUID,
  group_name   TEXT,
  type         TEXT DEFAULT 'post',
  poll_question TEXT,
  poll_options  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  image_url  TEXT,
  link_url   TEXT,
  mention    TEXT,
  privacy    TEXT DEFAULT 'all',
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.likes (
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella follows — gestita con DO BLOCK per evitare errori colonne
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'follows') THEN
    CREATE TABLE public.follows (
      follower_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
      following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id)
    );
  END IF;
END;
$$;

-- Aggiungi follower_id / following_id se mancanti
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='follows' AND column_name='follower_id') THEN
    ALTER TABLE public.follows ADD COLUMN follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='public' AND table_name='follows' AND column_name='following_id') THEN
    ALTER TABLE public.follows ADD COLUMN following_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE TABLE IF NOT EXISTS public.saves (
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  cover_url  TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id  UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text        TEXT,
  image_url   TEXT,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. AGGIUNGI COLONNE NUOVE (sicuro — salta se già esistono)
-- ============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality         TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS accepts_promotions  BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS views_count         INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS categories          TEXT[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count         INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_urls          TEXT[];
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read        BOOLEAN DEFAULT false;

-- sender_id è un alias di actor_id: mantieni entrambi per compatibilità
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id   UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================
-- 3. RLS — Abilita su tutte le tabelle
-- ============================================================
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLICY — Drop e ricrea (sicuro)
-- ============================================================

-- USERS
DROP POLICY IF EXISTS "Users are viewable by everyone"  ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"    ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"    ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile"    ON public.users;

CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE USING (auth.uid() = auth_id);

-- POSTS
DROP POLICY IF EXISTS "Public posts viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts"            ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts"        ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts"        ON public.posts;

CREATE POLICY "Public posts viewable by everyone"
  ON public.posts FOR SELECT
  USING (privacy = 'all' OR user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- STORIES
DROP POLICY IF EXISTS "Stories viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create stories"     ON public.stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;

CREATE POLICY "Stories viewable by everyone"
  ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create stories"
  ON public.stories FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- LIKES
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can like posts"       ON public.likes;
DROP POLICY IF EXISTS "Users can unlike posts"     ON public.likes;

CREATE POLICY "Likes viewable by everyone"
  ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts"
  ON public.likes FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- COMMENTS
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can comment"             ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Comments viewable by everyone"
  ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment"
  ON public.comments FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- FOLLOWS
DROP POLICY IF EXISTS "Follows viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow"             ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow"           ON public.follows;

CREATE POLICY "Follows viewable by everyone"
  ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow"
  ON public.follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users see own notifications"       ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Anyone can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- POST TAGS
DROP POLICY IF EXISTS "Tags viewable by everyone"       ON public.post_tags;
DROP POLICY IF EXISTS "Users can add tags to own posts" ON public.post_tags;

CREATE POLICY "Tags viewable by everyone"
  ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "Users can add tags to own posts"
  ON public.post_tags FOR INSERT WITH CHECK (true);

-- SAVES
DROP POLICY IF EXISTS "Users see own saves"    ON public.saves;
DROP POLICY IF EXISTS "Users can save posts"   ON public.saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON public.saves;

CREATE POLICY "Users see own saves"
  ON public.saves FOR SELECT
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can save posts"
  ON public.saves FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "Users can unsave posts"
  ON public.saves FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- GROUPS
DROP POLICY IF EXISTS "Groups viewable by everyone" ON public.groups;
CREATE POLICY "Groups viewable by everyone"
  ON public.groups FOR SELECT USING (true);

-- GROUP MEMBERS
DROP POLICY IF EXISTS "Group members viewable by everyone" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups"              ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups"             ON public.group_members;

CREATE POLICY "Group members viewable by everyone"
  ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE USING (true);

-- MESSAGES
DROP POLICY IF EXISTS "Users see own messages"  ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users see own messages"
  ON public.messages FOR SELECT
  USING (
    sender_id   IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR receiver_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- ============================================================
-- 5. STORAGE — Bucket media pubblico
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('media', 'media', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public media read"         ON storage.objects;
DROP POLICY IF EXISTS "Authenticated media write"  ON storage.objects;
DROP POLICY IF EXISTS "Owner media update"         ON storage.objects;
DROP POLICY IF EXISTS "Owner media delete"         ON storage.objects;

CREATE POLICY "Public media read"
  ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated media write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Owner media update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Owner media delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 6. REALTIME
-- ============================================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END;
$$;

-- ============================================================
-- 7. INDICI
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id    ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires  ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender  ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id    ON public.users(auth_id);

-- ============================================================
-- 8. GRUPPI UFFICIALI JES
-- ============================================================
INSERT INTO public.groups (name, is_private) VALUES
  ('Pittura',             false),
  ('Scultura',            false),
  ('Letteratura',         false),
  ('Fotografia',          false),
  ('Cucina Chef',         false),
  ('Tattoo',              false),
  ('Design',              false),
  ('Architettura',        false),
  ('Archeologia',         false),
  ('Storia',              false),
  ('Recitazione e Danza', false),
  ('Musica',              false),
  ('Fumettistica',        false),
  ('Arte di Strada',      false),
  ('Partner',             false),
  ('Moda / Fashion',      false),
  ('Sponsor',             false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FINE MIGRAZIONE — Completata con successo
-- ============================================================
