import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!;
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const { type, actor_user_id, target_user_id, post_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get push token of the recipient
    const { data: targetUser } = await supabase
      .from('users')
      .select('push_token, username')
      .eq('id', target_user_id)
      .single();

    if (!targetUser?.push_token) {
      return new Response(JSON.stringify({ ok: true, reason: 'no token' }), { status: 200 });
    }

    // Get actor name
    const { data: actor } = await supabase
      .from('users')
      .select('username, name')
      .eq('id', actor_user_id)
      .single();

    const actorName = actor?.name || actor?.username || 'Qualcuno';

    const messages: Record<string, { title: string; body: string; url: string }> = {
      like:    { title: 'Nuovo like ❤️', body: `@${actorName} ha messo like al tuo post`, url: `/post/${post_id}` },
      comment: { title: 'Nuovo commento 💬', body: `@${actorName} ha commentato il tuo post`, url: `/post/${post_id}` },
      follow:  { title: 'Nuovo follower ✨', body: `@${actorName} ha iniziato a seguirti`, url: `/profile/${actor?.username}` },
      mention: { title: 'Sei stato menzionato 📣', body: `@${actorName} ti ha menzionato`, url: `/post/${post_id}` },
    };

    const msg = messages[type];
    if (!msg) return new Response(JSON.stringify({ ok: true, reason: 'unknown type' }), { status: 200 });

    // Send via FCM legacy API
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: targetUser.push_token,
        notification: { title: msg.title, body: msg.body, sound: 'default' },
        data: { url: msg.url, type },
        priority: 'high',
      }),
    });

    const result = await fcmRes.json();
    return new Response(JSON.stringify({ ok: true, fcm: result }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
