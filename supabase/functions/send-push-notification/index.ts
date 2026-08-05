import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APNS_KEY_ID   = Deno.env.get('APNS_KEY_ID')!;        // N5CSBYLHLH
const APNS_TEAM_ID  = Deno.env.get('APNS_TEAM_ID')!;       // AA9JL76G8A
const APNS_PRIVATE_KEY = Deno.env.get('APNS_PRIVATE_KEY')!; // content of .p8 file
const BUNDLE_ID     = 'com.jes.social';
const APNS_HOST     = 'https://api.push.apple.com';

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

let cachedJwt: { token: string; exp: number } | null = null;

async function getAPNsJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now < cachedJwt.exp - 60) return cachedJwt.token;

  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'ES256', kid: APNS_KEY_ID })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ iss: APNS_TEAM_ID, iat: now })));
  const sigInput = `${header}.${payload}`;

  const pem = APNS_PRIVATE_KEY.replace(/\\n/g, '\n')
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(sigInput)
  );

  const token = `${sigInput}.${base64url(sig)}`;
  cachedJwt = { token, exp: now + 3600 };
  return token;
}

type MsgDef = { title: string; body: string; url: string };

function buildMsg(lang: string, type: string, actorName: string, actorUsername: string, postId: string | null): MsgDef | null {
  const a = actorName;
  const postUrl = `/post/${postId}`;
  const profileUrl = `/profile/${actorUsername}`;

  const T: Record<string, Record<string, MsgDef>> = {
    it: {
      like:     { title: 'Nuovo like ❤️',            body: `@${a} ha messo like al tuo post`,           url: postUrl },
      comment:  { title: 'Nuovo commento 💬',         body: `@${a} ha commentato il tuo post`,           url: postUrl },
      follow:   { title: 'Nuovo follower ✨',         body: `@${a} ha iniziato a seguirti`,              url: profileUrl },
      mention:  { title: 'Sei stato menzionato 📣',  body: `@${a} ti ha menzionato`,                    url: postUrl },
      new_post: { title: 'Nuovo post 🖼️',            body: `@${a} ha pubblicato qualcosa di nuovo`,     url: postUrl },
    },
    en: {
      like:     { title: 'New like ❤️',              body: `@${a} liked your post`,                     url: postUrl },
      comment:  { title: 'New comment 💬',            body: `@${a} commented on your post`,              url: postUrl },
      follow:   { title: 'New follower ✨',           body: `@${a} started following you`,               url: profileUrl },
      mention:  { title: 'You were mentioned 📣',    body: `@${a} mentioned you`,                       url: postUrl },
      new_post: { title: 'New post 🖼️',              body: `@${a} published something new`,             url: postUrl },
    },
    es: {
      like:     { title: 'Nuevo like ❤️',            body: `@${a} le gustó tu publicación`,             url: postUrl },
      comment:  { title: 'Nuevo comentario 💬',       body: `@${a} comentó tu publicación`,              url: postUrl },
      follow:   { title: 'Nuevo seguidor ✨',         body: `@${a} comenzó a seguirte`,                  url: profileUrl },
      mention:  { title: 'Te mencionaron 📣',        body: `@${a} te mencionó`,                         url: postUrl },
      new_post: { title: 'Nueva publicación 🖼️',     body: `@${a} publicó algo nuevo`,                  url: postUrl },
    },
    fr: {
      like:     { title: 'Nouveau like ❤️',          body: `@${a} a aimé votre publication`,            url: postUrl },
      comment:  { title: 'Nouveau commentaire 💬',    body: `@${a} a commenté votre publication`,        url: postUrl },
      follow:   { title: 'Nouvel abonné ✨',         body: `@${a} a commencé à vous suivre`,            url: profileUrl },
      mention:  { title: 'Vous êtes mentionné 📣',   body: `@${a} vous a mentionné`,                    url: postUrl },
      new_post: { title: 'Nouvelle publication 🖼️',  body: `@${a} a publié quelque chose de nouveau`,   url: postUrl },
    },
    de: {
      like:     { title: 'Neues Like ❤️',            body: `@${a} hat deinen Beitrag geliked`,          url: postUrl },
      comment:  { title: 'Neuer Kommentar 💬',        body: `@${a} hat deinen Beitrag kommentiert`,      url: postUrl },
      follow:   { title: 'Neuer Follower ✨',         body: `@${a} folgt dir jetzt`,                     url: profileUrl },
      mention:  { title: 'Du wurdest erwähnt 📣',    body: `@${a} hat dich erwähnt`,                    url: postUrl },
      new_post: { title: 'Neuer Beitrag 🖼️',         body: `@${a} hat etwas Neues veröffentlicht`,      url: postUrl },
    },
    pt: {
      like:     { title: 'Novo like ❤️',             body: `@${a} curtiu sua publicação`,               url: postUrl },
      comment:  { title: 'Novo comentário 💬',        body: `@${a} comentou sua publicação`,             url: postUrl },
      follow:   { title: 'Novo seguidor ✨',          body: `@${a} começou a te seguir`,                 url: profileUrl },
      mention:  { title: 'Você foi mencionado 📣',   body: `@${a} te mencionou`,                        url: postUrl },
      new_post: { title: 'Nova publicação 🖼️',        body: `@${a} publicou algo novo`,                  url: postUrl },
    },
    ja: {
      like:     { title: '新しいいいね ❤️',           body: `@${a}さんがあなたの投稿にいいねしました`,        url: postUrl },
      comment:  { title: '新しいコメント 💬',          body: `@${a}さんがあなたの投稿にコメントしました`,      url: postUrl },
      follow:   { title: '新しいフォロワー ✨',        body: `@${a}さんがあなたをフォローしました`,           url: profileUrl },
      mention:  { title: 'メンションされました 📣',    body: `@${a}さんがあなたをメンションしました`,         url: postUrl },
      new_post: { title: '新しい投稿 🖼️',             body: `@${a}さんが新しい投稿をしました`,              url: postUrl },
    },
    zh: {
      like:     { title: '新点赞 ❤️',                body: `@${a} 赞了你的帖子`,                         url: postUrl },
      comment:  { title: '新评论 💬',                 body: `@${a} 评论了你的帖子`,                       url: postUrl },
      follow:   { title: '新关注者 ✨',               body: `@${a} 开始关注你`,                           url: profileUrl },
      mention:  { title: '有人提到你 📣',            body: `@${a} 提到了你`,                             url: postUrl },
      new_post: { title: '新帖子 🖼️',                body: `@${a} 发布了新内容`,                         url: postUrl },
    },
    ar: {
      like:     { title: 'إعجاب جديد ❤️',           body: `@${a} أعجب بمنشورك`,                       url: postUrl },
      comment:  { title: 'تعليق جديد 💬',            body: `@${a} علّق على منشورك`,                    url: postUrl },
      follow:   { title: 'متابع جديد ✨',            body: `@${a} بدأ في متابعتك`,                     url: profileUrl },
      mention:  { title: 'تم ذكرك 📣',              body: `@${a} ذكرك في منشور`,                       url: postUrl },
      new_post: { title: 'منشور جديد 🖼️',           body: `@${a} نشر شيئاً جديداً`,                    url: postUrl },
    },
    ru: {
      like:     { title: 'Новый лайк ❤️',            body: `@${a} лайкнул ваш пост`,                    url: postUrl },
      comment:  { title: 'Новый комментарий 💬',      body: `@${a} прокомментировал ваш пост`,           url: postUrl },
      follow:   { title: 'Новый подписчик ✨',        body: `@${a} подписался на вас`,                   url: profileUrl },
      mention:  { title: 'Вас упомянули 📣',         body: `@${a} упомянул вас`,                        url: postUrl },
      new_post: { title: 'Новый пост 🖼️',            body: `@${a} опубликовал что-то новое`,             url: postUrl },
    },
    ko: {
      like:     { title: '새 좋아요 ❤️',             body: `@${a}님이 게시물을 좋아합니다`,               url: postUrl },
      comment:  { title: '새 댓글 💬',               body: `@${a}님이 게시물에 댓글을 달았습니다`,         url: postUrl },
      follow:   { title: '새 팔로워 ✨',             body: `@${a}님이 팔로우하기 시작했습니다`,            url: profileUrl },
      mention:  { title: '언급되었습니다 📣',         body: `@${a}님이 언급했습니다`,                     url: postUrl },
      new_post: { title: '새 게시물 🖼️',             body: `@${a}님이 새 게시물을 게시했습니다`,           url: postUrl },
    },
  };

  const langMap = T[lang] ?? T['it'];
  return langMap[type] ?? null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, actor_user_id, target_user_id, post_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: targetUser } = await supabase
      .from('users')
      .select('push_token, lang')
      .eq('id', target_user_id)
      .single();
    if (!targetUser?.push_token) {
      return new Response(JSON.stringify({ ok: true, reason: 'no token' }), { status: 200, headers: corsHeaders });
    }

    const { data: actor } = await supabase
      .from('users')
      .select('username, name')
      .eq('id', actor_user_id)
      .single();

    const actorName = actor?.name || actor?.username || 'Someone';
    const actorUsername = actor?.username || '';
    const lang = targetUser.lang || 'it';

    const msg = buildMsg(lang, type, actorName, actorUsername, post_id);
    if (!msg) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });

    const jwt = await getAPNsJWT();

    const apnsRes = await fetch(`${APNS_HOST}/3/device/${targetUser.push_token}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-push-type': 'alert',
        'apns-topic': BUNDLE_ID,
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        aps: {
          alert: { title: msg.title, body: msg.body },
          sound: 'default',
          badge: 1,
        },
        url: msg.url,
        type,
      }),
    });

    if (!apnsRes.ok) {
      const apnsBody = await apnsRes.json().catch(() => ({}));
      const reason = (apnsBody as any)?.reason;
      if (reason === 'BadDeviceToken' || reason === 'Unregistered') {
        await supabase.from('users').update({ push_token: null }).eq('id', target_user_id);
      }
      return new Response(JSON.stringify({ error: 'APNs error', status: apnsRes.status, reason }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
