-- ============================================================
-- JES — UPDATE v2 (sicuro su DB esistente)
-- Incolla nel SQL Editor di Supabase e clicca Run
-- ============================================================

-- 1. NUOVE COLONNE su users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone           TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio            TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS title          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email          TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_at   TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_level     INTEGER DEFAULT 1;
-- role_level: 1=user, 2=moderator, 3=admin

-- 2. TABELLA SEGNALAZIONI
CREATE TABLE IF NOT EXISTS public.reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  post_id          UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  type             TEXT NOT NULL DEFAULT 'other',
  -- type: 'spam', 'offensive', 'harassment', 'fake', 'other', 'feedback'
  description      TEXT,
  status           TEXT DEFAULT 'pending',
  -- status: 'pending', 'reviewed', 'dismissed'
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  reporter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- 3. TABELLA BLACKLIST PAROLE
CREATE TABLE IF NOT EXISTS public.blacklist_words (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word       TEXT UNIQUE NOT NULL,
  added_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blacklist_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blacklist_select" ON public.blacklist_words;
DROP POLICY IF EXISTS "blacklist_insert" ON public.blacklist_words;
DROP POLICY IF EXISTS "blacklist_delete" ON public.blacklist_words;
CREATE POLICY "blacklist_select" ON public.blacklist_words FOR SELECT USING (true);
CREATE POLICY "blacklist_insert" ON public.blacklist_words FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "blacklist_delete" ON public.blacklist_words FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- 4. PAROLE BLACKLIST DI DEFAULT (aggiungi le tue)
INSERT INTO public.blacklist_words (word) VALUES
  ('spam'), ('casino'), ('truffa'), ('scam'), ('seguimi'), ('followers gratis')
ON CONFLICT (word) DO NOTHING;

-- 5. INDICI AGGIUNTIVI
CREATE INDEX IF NOT EXISTS idx_reports_reporter   ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_blacklist_word     ON public.blacklist_words(word);
CREATE INDEX IF NOT EXISTS idx_users_suspended    ON public.users(suspended_at) WHERE suspended_at IS NOT NULL;

-- 6. VISUALIZZAZIONI POST
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Funzione RPC per incrementare views in modo sicuro (senza esporre UPDATE diretto)
CREATE OR REPLACE FUNCTION public.increment_post_views(pid UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = pid;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID) TO authenticated, anon;

-- 7. LIKE SULLE STORIE
CREATE TABLE IF NOT EXISTS public.story_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id   UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "story_likes_select" ON public.story_likes;
DROP POLICY IF EXISTS "story_likes_insert" ON public.story_likes;
DROP POLICY IF EXISTS "story_likes_delete" ON public.story_likes;
CREATE POLICY "story_likes_select" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "story_likes_insert" ON public.story_likes FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "story_likes_delete" ON public.story_likes FOR DELETE
  USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user  ON public.story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_views       ON public.posts(views_count DESC);

-- FINE
