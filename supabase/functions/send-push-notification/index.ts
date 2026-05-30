import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_PROJECT   = 'jes-social';
const SA_EMAIL      = Deno.env.get('FCM_SA_EMAIL')!;
const SA_PRIVATE_KEY = Deno.env.get('FCM_SA_PRIVATE_KEY')!.replace(/\\n/g, '\n');

// Get OAuth2 access token from service account
async function getFCMToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const sigInput = `${header}.${payload}`;

  const keyData = SA_PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(sigInput)
  );

  const jwt = `${sigInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  try {
    const { type, actor_user_id, target_user_id, post_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: targetUser } = await supabase.from('users').select('push_token').eq('id', target_user_id).single();
    if (!targetUser?.push_token) return new Response(JSON.stringify({ ok: true, reason: 'no token' }), { status: 200 });

    const { data: actor } = await supabase.from('users').select('username, name').eq('id', actor_user_id).single();
    const actorName = actor?.name || actor?.username || 'Qualcuno';

    const messages: Record<string, { title: string; body: string; url: string }> = {
      like:    { title: 'Nuovo like ❤️',      body: `@${actorName} ha messo like al tuo post`,  url: `/post/${post_id}` },
      comment: { title: 'Nuovo commento 💬',  body: `@${actorName} ha commentato il tuo post`,  url: `/post/${post_id}` },
      follow:  { title: 'Nuovo follower ✨',  body: `@${actorName} ha iniziato a seguirti`,     url: `/profile/${actor?.username}` },
      mention: { title: 'Sei menzionato 📣',  body: `@${actorName} ti ha menzionato`,           url: `/post/${post_id}` },
    };

    const msg = messages[type];
    if (!msg) return new Response(JSON.stringify({ ok: true }), { status: 200 });

    const accessToken = await getFCMToken();

    await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT}/messages:send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: targetUser.push_token,
          notification: { title: msg.title, body: msg.body },
          data: { url: msg.url, type },
          android: { priority: 'high' },
        },
      }),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
