import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { post_id, caller_auth_id, reason } = await request.json();
    if (!post_id || !caller_auth_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: caller } = await admin.from('users').select('id, role').eq('auth_id', caller_auth_id).single();
    if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: post } = await admin.from('posts').select('user_id, caption, created_at').eq('id', post_id).single();
    const isOwner = post?.user_id === caller.id;
    const isAdmin = caller.role === 'admin';

    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Se admin cancella un post altrui, invia notifica al proprietario
    if (isAdmin && !isOwner && post?.user_id && reason) {
      const postDate = post.created_at
        ? new Date(post.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
      const caption = post.caption ? `"${post.caption.slice(0, 60)}${post.caption.length > 60 ? '…' : ''}"` : '';
      const message = `Post ${caption ? caption + ' ' : ''}del ${postDate} rimosso dal team JES. Motivo: ${reason}`;
      await admin.from('notifications').insert({
        user_id: post.user_id,
        type: 'post_removed',
        actor_id: caller.id,
        post_id: null,
        message,
        read: false,
      });
    }

    await admin.from('likes').delete().eq('post_id', post_id);
    await admin.from('comments').delete().eq('post_id', post_id);
    await admin.from('post_tags').delete().eq('post_id', post_id);
    await admin.from('saves').delete().eq('post_id', post_id);
    await admin.from('posts').delete().eq('id', post_id);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
