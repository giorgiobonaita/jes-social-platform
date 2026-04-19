-- Aggiunge campo telefono opzionale agli utenti
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
