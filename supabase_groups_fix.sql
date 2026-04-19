-- Fix colonna created_by (rendi nullable)
ALTER TABLE public.groups ALTER COLUMN created_by DROP NOT NULL;

-- Inserisci solo i gruppi nuovi mancanti
INSERT INTO public.groups (name, is_private)
SELECT g.name, false FROM (VALUES
  ('Moda / Fashion'),
  ('Sponsor')
) AS g(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.groups WHERE groups.name = g.name
);
