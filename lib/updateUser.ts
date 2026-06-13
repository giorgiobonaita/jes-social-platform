import { supabase } from './supabase';

export async function updateUser(fields: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: { session } } = await supabase.auth.getSession();
  await fetch('/api/update-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
    body: JSON.stringify({ auth_id: user.id, ...fields }),
  });
}
