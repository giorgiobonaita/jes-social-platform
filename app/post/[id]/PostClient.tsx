'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  return `${Math.floor(h / 24)} g fa`;
}

interface PostData {
  id: string;
  caption: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  created_at: string;
  user_id: string;
  users: { name: string; username: string; avatar_url: string | null } | null;
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  users: { name: string; username: string; avatar_url: string | null } | null;
}

export default function PostClient({ id }: { id: string }) {
  const [post, setPost] = useState<PostData | null | undefined>(undefined);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    async function load() {
      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setAuthUserId(uid);

      // Fetch post
      const { data: postData } = await supabase
        .from('posts')
        .select('id, caption, image_url, image_urls, created_at, user_id')
        .eq('id', id)
        .single();

      if (!postData) { setPost(null); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('name, username, avatar_url')
        .eq('id', postData.user_id)
        .single();

      setPost({ ...postData, users: userData ?? null });

      // Likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', id);
      const likes = likesData ?? [];
      setLikeCount(likes.length);

      // Comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, text, created_at, users:user_id(name, username, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      setComments((commentsData as any) ?? []);

      if (uid) {
        // Resolve db user id
        const { data: dbUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', uid)
          .single();
        const dbId = dbUser?.id ?? null;
        setDbUserId(dbId);
        if (dbId) setLiked(likes.some((l: any) => l.user_id === dbId));
      }
    }
    load();
  }, [id]);

  const toggleLike = async () => {
    if (!dbUserId) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => c + (newLiked ? 1 : -1));
    if (newLiked) {
      await supabase.from('likes').insert({ post_id: id, user_id: dbUserId });
    } else {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', dbUserId);
    }
  };

  const sendComment = async () => {
    if (!dbUserId || !commentText.trim() || sending) return;
    setSending(true);
    const text = commentText.trim();
    setCommentText('');
    const { data: inserted } = await supabase
      .from('comments')
      .insert({ post_id: id, user_id: dbUserId, text })
      .select('id, text, created_at, users:user_id(name, username, avatar_url)')
      .single();
    if (inserted) setComments(prev => [...prev, inserted as any]);
    setSending(false);
  };

  const handleShare = async () => {
    const url = `https://jesocial.com/post/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'JES', url });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
    }
    try { await navigator.clipboard.writeText(url); showToast('Link copiato!'); } catch {}
  };

  // Loading
  if (post === undefined) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #F07B1D', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const author = post?.users ?? null;
  const imgs: string[] = (Array.isArray(post?.image_urls) && post!.image_urls!.length > 0)
    ? post!.image_urls!
    : post?.image_url ? [post.image_url] : [];
  const currentImg = imgs[imgIdx] ?? null;

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.82)', color: '#fff', padding: '10px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ width: '100%', maxWidth: 430, background: '#fff', borderBottom: '1px solid #EEEEEE', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, color: '#F07B1D', letterSpacing: -1, textDecoration: 'none', fontWeight: 800 }}>JES</Link>
        {authUserId ? (
          <Link href="/" style={{ background: '#F07B1D', color: '#fff', padding: '8px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Apri JES</Link>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/login" style={{ background: '#fff', color: '#F07B1D', border: '1.5px solid #F07B1D', padding: '7px 14px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Accedi</Link>
            <Link href="/signup" style={{ background: '#F07B1D', color: '#fff', padding: '8px 14px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Registrati</Link>
          </div>
        )}
      </header>

      <main style={{ width: '100%', maxWidth: 430, flex: 1 }}>
        {!post ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#666', fontSize: 15 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <svg width="52" height="52" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: '#111', marginBottom: 8 }}>Post non disponibile</p>
            <p>Il post potrebbe essere stato eliminato o essere privato.</p>
            <Link href="/" style={{ display: 'inline-block', marginTop: 24, background: '#F07B1D', color: '#fff', padding: '12px 28px', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>Vai a JES →</Link>
          </div>
        ) : (
          <div style={{ background: '#fff', marginTop: 8, paddingBottom: 16 }}>

            {/* Post header */}
            <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEE', overflow: 'hidden', flexShrink: 0 }}>
                {author?.avatar_url && <img src={author.avatar_url} alt={author.name} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{author?.name || 'Artista JES'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>@{author?.username || 'jes'} · {formatTimeAgo(post.created_at)}</div>
              </div>
              <button onClick={handleShare} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#888' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
              </button>
            </div>

            {/* Image(s) */}
            {currentImg && (
              <div style={{ width: '100%', background: '#F5F5F5', position: 'relative' }}>
                <img src={currentImg} alt={post.caption || 'Post JES'} style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'cover' }} />
                {imgs.length > 1 && (
                  <>
                    {imgIdx > 0 && (
                      <button onClick={() => setImgIdx(i => i - 1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    )}
                    {imgIdx < imgs.length - 1 && (
                      <button onClick={() => setImgIdx(i => i + 1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                    )}
                    <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                      {imgs.map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === imgIdx ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
              {authUserId && dbUserId ? (
                <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? '#F07B1D' : 'none'} stroke={liked ? '#F07B1D' : '#333'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{likeCount}</span>
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#CCC' }}>{likeCount}</span>
                </div>
              )}
              <button onClick={() => commentInputRef.current?.focus()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                <svg width="22" height="22" fill="none" stroke={authUserId ? '#333' : '#CCC'} strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: authUserId ? '#333' : '#CCC' }}>{comments.length}</span>
              </button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: '10px 16px 0', fontSize: 14, color: '#111', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>{author?.username || 'artista'} </span>
                {post.caption}
              </div>
            )}

            {/* Comments */}
            {comments.length > 0 && (
              <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEE', overflow: 'hidden', flexShrink: 0 }}>
                      {c.users?.avatar_url && <img src={c.users.avatar_url} alt={c.users.name} width={28} height={28} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{c.users?.username || 'utente'} </span>
                      <span style={{ fontSize: 13, color: '#333' }}>{c.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input or CTA */}
            {authUserId && dbUserId ? (
              <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendComment(); }}
                  placeholder="Aggiungi un commento…"
                  style={{ flex: 1, border: '1.5px solid #EEE', borderRadius: 20, padding: '8px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#FAFAFA' }}
                />
                <button
                  onClick={sendComment}
                  disabled={!commentText.trim() || sending}
                  style={{ background: commentText.trim() ? '#F07B1D' : '#EEE', color: commentText.trim() ? '#fff' : '#AAA', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}
                >
                  {sending ? '…' : 'Invia'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10 }}>
                <Link href="/login" style={{ flex: 1, display: 'block', textAlign: 'center', background: '#fff', color: '#F07B1D', border: '1.5px solid #F07B1D', padding: '13px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Accedi
                </Link>
                <Link href="/signup" style={{ flex: 1, display: 'block', textAlign: 'center', background: '#F07B1D', color: '#fff', padding: '13px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                  Registrati
                </Link>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ width: '100%', maxWidth: 430, padding: '20px 16px', display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12, color: '#AAA' }}>
        <Link href="/legal/privacy" style={{ color: '#AAA', textDecoration: 'none' }}>Privacy</Link>
        <Link href="/legal/termini" style={{ color: '#AAA', textDecoration: 'none' }}>Termini</Link>
        <span>© 2025 JES</span>
      </footer>

    </div>
  );
}
