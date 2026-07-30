import { supabase } from './supabase';

export async function createNotification({
  user_id,
  actor_id,
  type,
  post_id,
}: {
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  post_id?: string | null;
}) {
  if (!user_id || !actor_id || user_id === actor_id) return;

  const row: Record<string, string> = { user_id, actor_id, type };
  if (post_id) row.post_id = post_id;

  supabase.from('notifications').insert(row).then(() => {});

  fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type,
        actor_user_id: actor_id,
        target_user_id: user_id,
        post_id: post_id ?? null,
      }),
    }
  ).catch(() => {});
}
