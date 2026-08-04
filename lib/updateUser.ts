import { supabase } from './supabase';

const ALLOWED_FIELDS = ['name', 'bio', 'avatar_url', 'username', 'website', 'nationality', 'email', 'birth_date', 'categories', 'discipline', 'user_type', 'lang', 'push_token'];

export async function updateUser(fields: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const safeFields = Object.fromEntries(
    Object.entries(fields).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  if (Object.keys(safeFields).length === 0) return;

  await supabase.from('users').update(safeFields).eq('auth_id', user.id);
}
