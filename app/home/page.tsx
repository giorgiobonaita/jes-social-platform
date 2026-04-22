'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang, T } from '@/lib/i18n';
import FeedPoll from '@/components/FeedPoll';
import CommentsModal from '@/components/CommentsModal';
import CreateMenuModal from '@/components/CreateMenuModal';
import CreatePostModal from '@/components/CreatePostModal';
import CreateStoryModal from '@/components/CreateStoryModal';
import CreatePollModal from '@/components/CreatePollModal';
import ImageViewerModal from '@/components/ImageViewerModal';
import StoryViewer from '@/components/StoryViewer';
import SearchModal from '@/components/SearchModal';
import NotificationsModal from '@/components/NotificationsModal';
import ProfileModal from '@/components/ProfileModal';
import ChatModal from '@/components/ChatModal';
import GroupsModal from '@/components/GroupsModal';
import AvatarImg from '@/components/AvatarImg';

const ORANGE = '#F07B1D';
const GNG_MAIL = 'mailto:mogideag74@gmail.com';

const ADV_GB  = [
  { imageUrl: '/adv-gb1.png',  url: 'https://www.gbsrl-studioimmobiliare.it/' },
  { imageUrl: '/adv-gb2.png',  url: 'https://www.gbsrl-studioimmobiliare.it/' },
  { imageUrl: '/adv-gb3.png',  url: 'https://www.gbsrl-studioimmobiliare.it/' },
];
const ADV_GNG = [
  { imageUrl: '/adv-gng1.png', url: GNG_MAIL },
  { imageUrl: '/adv-gng2.png', url: GNG_MAIL },
  { imageUrl: '/adv-gng3.png', url: GNG_MAIL },
];
const ADV_GES = [
  { imageUrl: '/adv-ges1.png', url: 'https://gescompany.it/' },
  { imageUrl: '/adv-ges2.png', url: 'https://gescompany.it/' },
  { imageUrl: '/adv-ges3.png', url: 'https://gescompany.it/' },
];
const ADV_MER = [
  { imageUrl: '/adv-mer1.png', url: 'https://www.mercury-auctions.com/it_it/index/' },
  { imageUrl: '/adv-mer2.png', url: 'https://www.mercury-auctions.com/it_it/index/' },
  { imageUrl: '/adv-mer3.png', url: 'https://www.mercury-auctions.com/it_it/index/' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTimeAgo(isoDate: string, nowLabel: string, minSuffix: string, hSuffix: string, dSuffix: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return nowLabel;
  if (m < 60) return `${m} ${minSuffix}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${hSuffix}`;
  return `${Math.floor(h / 24)} ${dSuffix}`;
}

function buildFeed(posts: any[], viewerUsername?: string | null): any[] {
  const feed: any[] = [];
  const isMercury = viewerUsername === 'giuseppemercury';
  const advList = isMercury
    ? shuffleArray([...ADV_GB, ...ADV_GNG, ...ADV_GES, ...ADV_MER, ...ADV_MER])
    : shuffleArray([...ADV_GB, ...ADV_GNG, ...ADV_GES, ...ADV_MER]);
  let advIdx = 0;
  const nextAdv = () => {
    const sp = advList[advIdx % advList.length];
    advIdx++;
    return { type: 'adv', id: `adv_${advIdx}_${Date.now()}`, imageUrl: sp.imageUrl, url: sp.url };
  };
  for (let i = 0; i < posts.length; i++) {
    feed.push(posts[i]);
    if ((i + 1) % 4 === 0) feed.push(nextAdv());
  }
  return feed;
}

interface UserStoryGroup {
  userId: string; username: string; name: string; avatarUrl: string | null;
  stories: { id: string; imageUrl: string; timeAgo: string }[];
}

// ── Story Ring ──────────────────────────────────────────────────────────────────
function StoryRing({ id, username, avatarUrl, isCustom, hasUnwatched, onPress }: {
  id: string; username: string; avatarUrl?: string | null;
  isCustom?: boolean; hasUnwatched?: boolean; onPress: () => void;
}) {
  return (
    <div className="story-ring" onClick={onPress} tabIndex={0} role="button">
      <div style={{ position: 'relative' }}>
        <div className={`story-ring-border${(!hasUnwatched && !isCustom) ? ' no-story' : ''}`}>
          <div className="story-ring-inner">
            <AvatarImg uri={avatarUrl} size={56} seed={username} style={{ borderRadius: '12px', width: '100%', height: '100%' }} />
          </div>
        </div>
        {isCustom && (
          <div className="story-add-btn">
            <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </div>
        )}
      </div>
      <span className="story-ring-label">{username}</span>
    </div>
  );
}

// ── Report Sheet ──────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { id: 'spam', label: 'Spam' },
  { id: 'offensive', label: 'Contenuto offensivo' },
  { id: 'harassment', label: 'Molestie' },
  { id: 'fake', label: 'Informazioni false' },
  { id: 'other', label: 'Altro' },
];

function ReportSheet({ postId, currentUserId, reportedUserId, onDone }: { postId: string; currentUserId: string | null; reportedUserId: string | null; onDone: () => void }) {
  const { t } = useLang();
  const [type, setType] = useState('spam');
  const [desc, setDesc] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (sent) return (
    <>
      <p className="confirm-title">{t('report_sent_title')}</p>
      <p className="confirm-msg">{t('report_sent_msg')}</p>
      <button className="confirm-btn-cancel" onClick={onDone}>{t('report_close')}</button>
    </>
  );

  return (
    <>
      <p className="confirm-title">{t('report_title')}</p>
      <div style={{ textAlign: 'left', width: '100%', marginBottom: 12 }}>
        {REPORT_TYPES.map(rt => (
          <label key={rt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
            <input type="radio" name="rtype" value={rt.id} checked={type === rt.id} onChange={() => setType(rt.id)} style={{ accentColor: ORANGE }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#111' }}>{rt.label}</span>
          </label>
        ))}
      </div>
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('report_desc_ph')} rows={3} style={{ width: '100%', borderRadius: 10, border: '1px solid #EEE', padding: 10, fontFamily: 'var(--font-body)', fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 } as any} />
      <button className="confirm-btn-danger" onClick={async () => {
        setSending(true);
        await supabase.from('reports').insert({ reporter_id: currentUserId || null, reported_user_id: reportedUserId || null, post_id: postId, type, description: desc.trim() || null });
        setSending(false); setSent(true);
      }}>{sending ? '…' : t('report_send')}</button>
      <button className="confirm-btn-cancel" onClick={onDone}>{t('cancel')}</button>
    </>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserAvatar, onComment, onUserPress, onDelete, isAdmin, onImagePress, isFollowingAuthor, onFollowAuthor, onShareToast }: {
  post: any; currentUserAvatar?: string | null;
  onComment: () => void; onUserPress: (id: string) => void;
  onDelete: () => void; isAdmin: boolean;
  onImagePress: (url: string) => void;
  isFollowingAuthor?: boolean; onFollowAuthor?: (userId: string) => void;
  onShareToast?: () => void;
}) {
  const { t } = useLang();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [viewsCount, setViewsCount] = useState(post.viewsCount || 0);
  const [saved, setSaved] = useState(false);
  const viewedRef = useRef(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'report' | 'ban' | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [caption, setCaption] = useState(post.caption || '');
  const [previewComments, setPreviewComments] = useState<{ id: string; username: string; text: string }[]>([]);
  const lastTap = useRef<number>(0);

  const isOfficial = post.author?.role === 'official' || post.author?.role === 'admin';
  const photos: string[] = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
  const isCarousel = photos.length > 1;
  const isOwn = post.userId && post.currentUserId && post.userId === post.currentUserId;

  useEffect(() => { setLiked(post.isLiked); }, [post.isLiked]);
  useEffect(() => { setLikesCount(post.likesCount); }, [post.likesCount]);

  useEffect(() => {
    if (viewedRef.current || !post.id) return;
    viewedRef.current = true;
    supabase.rpc('increment_post_views', { pid: post.id }).then(() => {
      setViewsCount((v: number) => v + 1);
    });
  }, [post.id]);

  useEffect(() => {
    if (!post.currentUserId) return;
    supabase.from('saves').select('id').eq('post_id', post.id).eq('user_id', post.currentUserId).maybeSingle()
      .then(({ data }) => { if (data) setSaved(true); });
  }, [post.id, post.currentUserId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('comments').select('id, text, user_id, users(username)')
        .eq('post_id', post.id).order('created_at', { ascending: true }).limit(4);
      if (!data) return;
      setPreviewComments(data.map((c: any) => ({ id: c.id, text: c.text || '', username: (c.users as any)?.username || 'utente' })));
    })();
  }, [post.id]);

  const toggleLike = async () => {
    if (!post.currentUserId) return;
    if (liked) {
      setLiked(false); setLikesCount((p: number) => p - 1);
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', post.currentUserId);
    } else {
      setLiked(true); setLikesCount((p: number) => p + 1);
      await supabase.from('likes').insert({ post_id: post.id, user_id: post.currentUserId });
      if (post.userId && post.userId !== post.currentUserId) {
        supabase.from('notifications').insert({ user_id: post.userId, actor_id: post.currentUserId, type: 'like', post_id: post.id }).then(() => {});
      }
    }
  };

  const toggleSave = async () => {
    if (!post.currentUserId) return;
    if (saved) {
      setSaved(false);
      await supabase.from('saves').delete().eq('post_id', post.id).eq('user_id', post.currentUserId);
    } else {
      setSaved(true);
      await supabase.from('saves').insert({ post_id: post.id, user_id: post.currentUserId });
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked && post.currentUserId) { setLiked(true); setLikesCount((p: number) => p + 1); supabase.from('likes').insert({ post_id: post.id, user_id: post.currentUserId }); }
    }
    lastTap.current = now;
  };

  const handleEditCaption = async () => {
    const trimmed = editCaptionText.trim();
    if (!trimmed) return;
    await supabase.from('posts').update({ caption: trimmed }).eq('id', post.id);
    setCaption(trimmed);
    setEditingCaption(false);
  };

  const handleDelete = async () => {
    setConfirmAction(null); setMenuOpen(false);
    await supabase.from('posts').delete().eq('id', post.id);
    onDelete();
  };

  const handleBan = async () => {
    setConfirmAction(null); setMenuOpen(false);
    if (post.userId) await supabase.from('users').update({ is_banned: true }).eq('id', post.userId);
  };

  const LINK_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|it|net|org|io|co|uk|de|fr|es|eu|app|dev|me|info|biz|edu)(?:\/[^\s]*)?)/g;
  const renderCaption = (text: string) => {
    const parts: { text: string; isUrl: boolean }[] = [];
    let last = 0; let match;
    const re = new RegExp(LINK_RE.source, 'g');
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) parts.push({ text: text.slice(last, match.index), isUrl: false });
      parts.push({ text: match[0], isUrl: true });
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last), isUrl: false });
    return parts.map((p, i) => p.isUrl
      ? <a key={i} href={p.text.startsWith('http') ? p.text : `https://${p.text}`} target="_blank" rel="noopener noreferrer" style={{ color: ORANGE, textDecoration: 'underline' }}>{p.text}</a>
      : <span key={i}>{p.text}</span>
    );
  };

  return (
    <>
      <div className="pc-post">
        {/* Header */}
        <div className="pc-header">
          <div className="pc-avatar-ring" onClick={() => onUserPress(post.userId)} style={{ cursor: 'pointer' }}>
            <AvatarImg uri={post.author?.avatarUrl} size={40} seed={post.author?.username} className="pc-avatar-img" style={{ borderRadius: '50%' }} />
          </div>
          <div className="pc-meta" onClick={() => onUserPress(post.userId)} style={{ cursor: 'pointer' }}>
            <div className="pc-username">
              {post.author?.username}{post.groupName ? ` — ${post.groupName}` : ''}
              {isOfficial && (
                <svg style={{ marginLeft: 3, verticalAlign: 'middle', flexShrink: 0 }} width="15" height="15" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="12" fill="#F07B1D"/>
                  <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
            <div className="pc-discipline">{post.author?.discipline}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span className="pc-timeago">{post.timeAgo}</span>
            {post.createdAt && (
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#BBBBBB' }}>
                {new Date(post.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          {!isOwn && !isFollowingAuthor && post.currentUserId && onFollowAuthor && (
            <button onClick={async () => {
              if (!post.currentUserId || !post.userId) return;
              onFollowAuthor(post.userId);
              await supabase.from('follows').insert({ follower_id: post.currentUserId, followed_id: post.userId });
            }} style={{ background: 'none', border: `1.5px solid ${ORANGE}`, borderRadius: 20, padding: '3px 10px', cursor: 'pointer', marginRight: 4 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: ORANGE }}>{t('post_follow_btn')}</span>
            </button>
          )}
          <button className="pc-more-btn" onClick={() => setMenuOpen(true)}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
        </div>

        {/* Image / Carousel */}
        {photos.length > 0 && (
          <div className="pc-image-wrap" onClick={handleDoubleTap}>
            {isCarousel ? (
              <>
                <div className="pc-carousel-track" style={{ transform: `translateX(-${carouselIdx * 100}%)` }}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="post" className="pc-carousel-slide" onClick={() => onImagePress(url)} />
                  ))}
                </div>
                <div className="pc-dots">
                  {photos.map((_, i) => <div key={i} className={`pc-dot${i === carouselIdx ? ' active' : ''}`} />)}
                </div>
                <button className="pc-carousel-prev" onClick={e => { e.stopPropagation(); setCarouselIdx(p => Math.max(0, p - 1)); }} style={{ display: carouselIdx === 0 ? 'none' : 'flex' }}>‹</button>
                <button className="pc-carousel-next" onClick={e => { e.stopPropagation(); setCarouselIdx(p => Math.min(photos.length - 1, p + 1)); }} style={{ display: carouselIdx === photos.length - 1 ? 'none' : 'flex' }}>›</button>
              </>
            ) : (
              <img src={photos[0]} alt="post" className="pc-single-img" onClick={() => onImagePress(photos[0])} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pc-actions">
          <div className="pc-actions-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className={`pc-action-btn${liked ? ' liked' : ''}`} onClick={toggleLike}>
                {liked
                  ? <svg width="28" height="28" fill={ORANGE} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  : <svg width="28" height="28" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                }
              </button>
              {likesCount > 0 && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#111' }}>{likesCount.toLocaleString('it-IT')}</span>}
            </div>
            <button className="pc-action-btn" onClick={onComment}>
              <svg width="26" height="26" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </button>
            <button className="pc-action-btn" onClick={async () => {
              const shareUrl = `${window.location.origin}/post/${post.id}`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: `Post di @${post.author?.username} su JES`, url: shareUrl });
                  return;
                } catch (e: any) {
                  if (e?.name === 'AbortError') return;
                }
              }
              try {
                await navigator.clipboard.writeText(shareUrl);
                onShareToast?.();
              } catch {
                onShareToast?.();
              }
            }}>
              <svg width="26" height="26" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!isOwn && (
              <button className="pc-action-btn" title="Segnala" onClick={() => { setMenuOpen(false); setTimeout(() => setConfirmAction('report'), 50); }} style={{ opacity: 0.55 }}>
                <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              </button>
            )}
            <button className={`pc-action-btn${saved ? ' saved' : ''}`} onClick={toggleSave}>
              {saved
                ? <svg width="26" height="26" fill={ORANGE} viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                : <svg width="26" height="26" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Text block */}
        <div className="pc-text">
          {viewsCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <svg width="14" height="14" fill="none" stroke="#AAAAAA" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAAAAA' }}>{viewsCount.toLocaleString('it-IT')}</span>
            </div>
          )}

          {caption && (
            <div className="pc-caption-wrap" onClick={() => setExpanded(p => !p)}>
              <span className="pc-caption">
                <strong className="pc-caption-user">{post.author?.username} </strong>
                {!expanded && caption.length > 80 ? renderCaption(caption.slice(0, 80)) : renderCaption(caption)}
              </span>
              {!expanded && caption.length > 80 && <span className="pc-more"> {t('post_more')}</span>}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <p className="pc-hashtags">{post.tags.map((t: string) => `#${t}`).join('  ')}</p>
          )}

          {previewComments.length > 0 && (
            <div className="pc-comments-preview">
              {previewComments.map(c => (
                <p key={c.id} className="pc-comment-line">
                  <strong>{c.username} </strong>{c.text}
                </p>
              ))}
            </div>
          )}

          {post.commentsCount > 4 && (
            <button className="pc-view-comments" onClick={onComment}>{t('post_see_all_comments')} {post.commentsCount} {t('post_comments_label')}</button>
          )}
          {post.commentsCount > 0 && post.commentsCount <= 4 && (
            <button className="pc-view-comments" onClick={onComment}>{t('post_see_comments')}</button>
          )}
        </div>

        {/* Quick comment bar */}
        <div className="pc-quick-comment" onClick={onComment}>
          <div className="pc-quick-avatar">
            <AvatarImg uri={currentUserAvatar} size={28} seed="tu" style={{ borderRadius: '50%' }} />
          </div>
          <div className="pc-quick-input">
            <span className="pc-quick-placeholder">{t('add_comment')}</span>
          </div>
        </div>
      </div>

      {/* 3-dot Menu Bottom Sheet */}
      {menuOpen && (
        <div className="modal-overlay" onClick={() => setMenuOpen(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="pc-sheet-title">{post.author?.username}</p>

            {isOwn && (
              <div className="pc-sheet-option" onClick={() => { setMenuOpen(false); setEditCaptionText(caption); setTimeout(() => setEditingCaption(true), 200); }}>
                <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>{t('edit_msg')}</span>
              </div>
            )}
            {(isOwn || isAdmin) && (
              <div className="pc-sheet-option danger" onClick={() => { setMenuOpen(false); setTimeout(() => setConfirmAction('delete'), 200); }}>
                <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                <span>{isAdmin && !isOwn ? t('delete_post_admin') : t('delete_post')}</span>
              </div>
            )}
            {isAdmin && !isOwn && post.userId && (
              <div className="pc-sheet-option danger" onClick={() => { setMenuOpen(false); setTimeout(() => setConfirmAction('ban'), 200); }}>
                <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span>{t('ban_user')}</span>
              </div>
            )}
            <div className="pc-sheet-divider" />
            <div className="pc-sheet-option" onClick={() => { setMenuOpen(false); setTimeout(() => setConfirmAction('report'), 200); }}>
              <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              <span>{t('report')}</span>
            </div>
            <div className="pc-sheet-cancel" onClick={() => setMenuOpen(false)}>{t('cancel')}</div>
          </div>
        </div>
      )}

      {/* Edit caption sheet */}
      {editingCaption && (
        <div className="modal-overlay" onClick={() => setEditingCaption(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p className="pc-sheet-title">{t('edit_msg')}</p>
            <textarea
              autoFocus
              value={editCaptionText}
              onChange={e => setEditCaptionText(e.target.value)}
              maxLength={2000}
              rows={5}
              style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 15, color: '#111', border: '1.5px solid #EEE', borderRadius: 14, padding: '12px 14px', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditingCaption(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1.5px solid #EEE', background: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#555', cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={handleEditCaption} disabled={!editCaptionText.trim()} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: ORANGE, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#fff', cursor: 'pointer', opacity: editCaptionText.trim() ? 1 : 0.4 }}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialogs */}
      {confirmAction && (
        <div className="modal-overlay center" onClick={() => setConfirmAction(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            {confirmAction === 'delete' && <>
              <p className="confirm-title">{t('confirm_delete_post')}</p>
              <p className="confirm-msg">{t('confirm_delete_msg')}</p>
              <button className="confirm-btn-danger" onClick={handleDelete}>{t('delete')}</button>
              <button className="confirm-btn-cancel" onClick={() => setConfirmAction(null)}>{t('cancel')}</button>
            </>}
            {confirmAction === 'ban' && <>
              <p className="confirm-title">{t('confirm_ban_title')} {post.author?.username}</p>
              <p className="confirm-msg">{t('confirm_ban_msg')}</p>
              <button className="confirm-btn-danger" onClick={handleBan}>{t('confirm_ban_btn')}</button>
              <button className="confirm-btn-cancel" onClick={() => setConfirmAction(null)}>{t('cancel')}</button>
            </>}
            {confirmAction === 'report' && <ReportSheet postId={post.id} currentUserId={post.currentUserId} reportedUserId={post.userId} onDone={() => setConfirmAction(null)} />}
          </div>
        </div>
      )}
    </>
  );
}

// ── ADV Card ──────────────────────────────────────────────────────────────────
function AdvCard({ imageUrl, url }: { imageUrl: string; url: string }) {
  const { t } = useLang();
  const handleClick = () => {
    if (url.startsWith('mailto:')) { window.location.href = url; } else { window.open(url, '_blank'); }
  };
  return (
    <div className="adv-card" style={{ cursor: 'pointer' }} onClick={handleClick}>
      <div style={{ display: 'flex' }}>
        <div className="adv-badge">
          <svg width="11" height="11" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span className="adv-badge-text">{t('adv_sponsored')}</span>
        </div>
      </div>
      <img className="adv-img" src={imageUrl} alt="sponsor" loading="lazy" />
      <div className="adv-footer">
        <div className="adv-link-btn">
          <span className="adv-link-text">{t('adv_visit_link')}</span>
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const tl = (k: string) => T[lang][k] ?? T['en'][k] ?? k;
  const fmtTime = (iso: string) => formatTimeAgo(iso, tl('groups_now'), tl('notif_mins_ago'), tl('notif_hours_ago'), tl('time_d_ago'));

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const feedScrollRef = useRef<HTMLDivElement>(null);

  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<UserStoryGroup[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 30;

  const [storyVisible, setStoryVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAuthorId, setCommentsAuthorId] = useState<string | null>(null);

  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  const [searchVisible, setSearchVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileTargetUserId, setProfileTargetUserId] = useState<string | undefined>();
  const [chatVisible, setChatVisible] = useState(false);
  const [chatOpenWith, setChatOpenWith] = useState<{ userId: string; name: string; avatar: string | null } | null>(null);
  const [groupsVisible, setGroupsVisible] = useState(false);
  const [groupsInitialId, setGroupsInitialId] = useState<string | undefined>();
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [createStoryVisible, setCreateStoryVisible] = useState(false);
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const [jesPostAuthorId, setJesPostAuthorId] = useState<string | undefined>();
  const [jesStoryAuthorId, setJesStoryAuthorId] = useState<string | undefined>();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 1200); return () => clearTimeout(t); }, []);

  const allPosts = useMemo(() => [...groupPosts, ...dbPosts], [groupPosts, dbPosts]);
  const feedData = useMemo(() => buildFeed(allPosts, myUsername), [allPosts, myUsername]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }
      const { data } = await supabase.from('users').select('id, avatar_url, role, username').eq('auth_id', user.id).single();
      if (data) {
        setCurrentUserId(data.id);
        setCurrentUserAvatar(data.avatar_url || null);
        setIsAdmin(data.role === 'admin');
        setMyUsername(data.username || null);
        supabase.from('follows').select('followed_id').eq('follower_id', data.id).then(({ data: rows }) => {
          if (rows) setFollowingIds(prev => new Set([...prev, ...rows.map((r: any) => r.followed_id)]));
        });
        const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', data.id).eq('read', false);
        setHasUnread((count || 0) > 0);
      }
    })();
  }, [router]);

  const CACHE_KEY = 'jes_feed_v1';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

  const mapPosts = useCallback(async (posts: any[], dbUserId: string | null, append: boolean) => {
    const postIds = posts.map((p: any) => p.id);
    const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
    const [{ data: usersData }, { data: tagsData }, { data: likesData }, { data: commentsData }] =
      await Promise.all([
        supabase.from('users').select('id, username, name, avatar_url, discipline, role').in('id', userIds),
        supabase.from('post_tags').select('post_id, tag').in('post_id', postIds),
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('id, post_id').in('post_id', postIds),
      ]);
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });
    const tagsByPost: Record<string, string[]> = {};
    (tagsData || []).forEach((t: any) => { if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = []; tagsByPost[t.post_id].push(t.tag); });
    const likesByPost: Record<string, string[]> = {};
    (likesData || []).forEach((l: any) => { if (!likesByPost[l.post_id]) likesByPost[l.post_id] = []; likesByPost[l.post_id].push(l.user_id); });
    const commentsByPost: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => { commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1; });
    const mapped = posts.map((p: any) => {
      const u = userMap[p.user_id] || {};
      let imageUrls: string[] = [];
      if (Array.isArray(p.image_urls) && p.image_urls.length > 0) {
        imageUrls = p.image_urls;
      } else if (typeof p.image_urls === 'string' && p.image_urls.startsWith('{')) {
        // PostgreSQL array format: {url1,url2}
        imageUrls = p.image_urls.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
      } else if (p.image_url) {
        imageUrls = [p.image_url];
      }
      return {
        type: p.type || 'post', id: p.id, userId: p.user_id,
        pollQuestion: p.poll_question, pollOptions: p.poll_options,
        author: { name: u.name || 'Utente', username: u.username || 'utente', avatarUrl: u.avatar_url || null, discipline: u.discipline || '', role: u.role || null },
        imageUrls, aspectRatio: p.aspect_ratio || 1,
        likesCount: (likesByPost[p.id] || []).length,
        commentsCount: commentsByPost[p.id] || 0,
        viewsCount: p.views_count || 0,
        isLiked: dbUserId ? (likesByPost[p.id] || []).includes(dbUserId) : false,
        currentUserId: dbUserId,
        caption: p.caption || '',
        timeAgo: fmtTime(p.created_at),
        createdAt: p.created_at,
        tags: tagsByPost[p.id] || [],
        groupName: p.group_name || undefined,
      };
    });
    if (append) setDbPosts(prev => [...prev, ...mapped]);
    else { setDbPosts(mapped); try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: mapped })); } catch {} }
  }, []);

  const loadDbPosts = useCallback(async () => {
    // Mostra cache subito se fresca (< 5 min)
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < CACHE_TTL) setDbPosts(data);
      }
    } catch {}

    const { data: posts, error } = await supabase
      .from('posts').select('*').order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1);
    if (error || !posts || posts.length === 0) return;
    setHasMorePosts(posts.length === PAGE_SIZE);
    setFeedPage(1);

    const authResult = await supabase.auth.getUser();
    let dbUserId: string | null = null;
    if (authResult.data.user) {
      const { data: u } = await supabase.from('users').select('id').eq('auth_id', authResult.data.user.id).single();
      dbUserId = u?.id ?? null;
    }
    await mapPosts(posts, dbUserId, false);
  }, [mapPosts]);

  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMorePosts) return;
    setLoadingMore(true);
    const authResult = await supabase.auth.getUser();
    let dbUserId: string | null = null;
    if (authResult.data.user) {
      const { data: u } = await supabase.from('users').select('id').eq('auth_id', authResult.data.user.id).single();
      dbUserId = u?.id ?? null;
    }
    const from = feedPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: posts, error } = await supabase
      .from('posts').select('*').order('created_at', { ascending: false }).range(from, to);
    if (!error && posts && posts.length > 0) {
      await mapPosts(posts, dbUserId, true);
      setFeedPage(prev => prev + 1);
      setHasMorePosts(posts.length === PAGE_SIZE);
    } else {
      setHasMorePosts(false);
    }
    setLoadingMore(false);
  }, [feedPage, hasMorePosts, loadingMore, mapPosts]);

  const loadStories = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('stories').select('*').gt('expires_at', now).order('created_at', { ascending: false }).limit(50);
    if (error || !data || data.length === 0) return;
    const userIds = [...new Set(data.map((s: any) => s.user_id).filter(Boolean))];
    const { data: usersData } = await supabase.from('users').select('id, username, name, avatar_url').in('id', userIds);
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });
    const groupMap: Record<string, UserStoryGroup> = {};
    data.forEach((s: any) => {
      if (!s.user_id) return;
      if (!groupMap[s.user_id]) {
        const u = userMap[s.user_id] || {};
        groupMap[s.user_id] = { userId: s.user_id, username: u.username || tl('user_fallback').toLowerCase(), name: u.name || tl('user_fallback'), avatarUrl: u.avatar_url || null, stories: [] };
      }
      groupMap[s.user_id].stories.push({ id: s.id, imageUrl: s.image_url, timeAgo: fmtTime(s.created_at) });
    });
    setStories(Object.values(groupMap));
  }, []);

  useEffect(() => { loadDbPosts(); loadStories(); }, [loadDbPosts, loadStories]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase.channel('web:updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, loadDbPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, loadDbPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, loadStories)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload: any) => {
        const pid = payload.new?.post_id;
        setDbPosts(prev => prev.map((p: any) => p.id === pid ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` }, () => setHasUnread(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadDbPosts, loadStories]);

  return (
    <div className="shell home-page">
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 20, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, zIndex: 9998, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
      {showSplash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/logo.png" alt="JES" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          <span style={{ position: 'absolute', bottom: 48, fontSize: 22, fontWeight: 700, color: '#444', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
            art by
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#F07B1D">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </span>
        </div>
      )}
      {/* Header */}
      <header className="home-header">
        <div className="header-side">
          <button className="icon-btn" onClick={() => setChatVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
          <button className="icon-btn" onClick={() => setSearchVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>

        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: ORANGE, letterSpacing: -1, cursor: 'pointer' }} onClick={() => feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>JES</span>

        <div className="header-side">
          <button className="icon-btn" onClick={() => setGroupsVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </button>
          <button className="icon-btn" style={{ position: 'relative' }} onClick={() => { setNotifVisible(true); setHasUnread(false); }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            {hasUnread && <div className="notif-badge" />}
          </button>
        </div>
      </header>

      {/* Feed */}
      <div className="feed-scroll" ref={feedScrollRef} onScroll={e => {
        const el = e.target as HTMLDivElement;
        setShowScrollTop(el.scrollTop > 300);
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 400) loadMorePosts();
      }}>
        {/* Stories */}
        <div className="stories-section">
          <p className="stories-label">{t('following')}</p>
          <div className="stories-row">
            <StoryRing id="create" username={t('story_your')} avatarUrl={currentUserAvatar} isCustom onPress={() => setCreateStoryVisible(true)} />
            {stories.map((g, idx) => (
              <StoryRing key={g.userId} id={g.userId} username={g.username} avatarUrl={g.avatarUrl} hasUnwatched
                onPress={() => { setActiveStoryIndex(idx); setStoryVisible(true); }} />
            ))}
          </div>
        </div>

        {/* Posts */}
        {feedData.length === 0 && (
          <div className="spinner" style={{ marginTop: 60 }}><div className="spin" /></div>
        )}
        {feedData.map(item => {
          if (item.type === 'adv') return <AdvCard key={item.id} imageUrl={item.imageUrl} url={item.url} />;
          if (item.type === 'poll') return (
            <FeedPoll
              key={item.id}
              postId={item.id}
              question={item.pollQuestion}
              initialOptions={item.pollOptions || []}
              initialTotalVotes={item.pollOptions?.reduce((acc: number, o: any) => acc + (o.votes || 0), 0) || 0}
              currentUserId={currentUserId}
              postUserId={item.userId}
              isAdmin={isAdmin}
              onDelete={() => setDbPosts(prev => prev.filter(p => p.id !== item.id))}
            />
          );
          return (
            <PostCard
              key={item.id} post={item}
              currentUserAvatar={currentUserAvatar}
              onComment={() => { setCommentsPostId(item.id); setCommentsAuthorId(item.userId); setCommentsVisible(true); }}
              onUserPress={(uid) => { setProfileTargetUserId(uid); setProfileVisible(true); }}
              onDelete={() => setDbPosts(prev => prev.filter(p => p.id !== item.id))}
              isAdmin={isAdmin}
              onImagePress={(url) => { setImageViewerUrl(url); setImageViewerVisible(true); }}
              isFollowingAuthor={item.userId ? followingIds.has(item.userId) : false}
              onFollowAuthor={(uid) => setFollowingIds(prev => new Set([...prev, uid]))}
              onShareToast={() => showToast(t('share_toast'))}
            />
          );
        })}
        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}><div className="spin" /></div>
        )}
      </div>

      {/* Scroll-to-top */}
      {showScrollTop && (
        <button onClick={() => { feedScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); setShowScrollTop(false); }}
          style={{ position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', border: '1px solid #E0E0E0', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" fill="none" stroke="#555" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-tab" onClick={() => {}}>
          <svg width="26" height="26" fill={ORANGE} viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        <button className="nav-tab" onClick={() => setCreateMenuVisible(true)}>
          <div className="create-circle">
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </button>
        <button className="nav-tab" onClick={() => { setProfileTargetUserId(undefined); setProfileVisible(true); }}>
          <svg width="26" height="26" fill="none" stroke="#AAAAAA" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
      </nav>

      {/* Modals */}
      <ImageViewerModal imageUrl={imageViewerUrl} visible={imageViewerVisible} onClose={() => { setImageViewerVisible(false); setImageViewerUrl(null); }} />
      <StoryViewer
        groups={stories}
        initialGroupIndex={activeStoryIndex}
        visible={storyVisible}
        onClose={() => setStoryVisible(false)}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onStoryDeleted={(deletedId) => {
          setStories(prev => prev.map(g => ({
            ...g,
            stories: g.stories.filter(s => s.id !== deletedId),
          })).filter(g => g.stories.length > 0));
        }}
        onUserPress={(uid) => { setStoryVisible(false); setProfileTargetUserId(uid); setProfileVisible(true); }}
      />
      <CommentsModal visible={commentsVisible} postId={commentsPostId} postAuthorId={commentsAuthorId} onClose={() => { setCommentsVisible(false); setCommentsPostId(null); setCommentsAuthorId(null); }} />
      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)}
        onUserPress={uid => { setProfileTargetUserId(uid); setProfileVisible(true); }}
        onGroupPress={gid => { setGroupsInitialId(gid); setGroupsVisible(true); }}
        onPostPress={(_, url) => { setImageViewerUrl(url); setImageViewerVisible(true); }} />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <ProfileModal visible={profileVisible} targetUserId={profileTargetUserId}
        onClose={() => { setProfileVisible(false); setProfileTargetUserId(undefined); }}
        onMessagePress={(uid, name, avatar) => { setChatOpenWith({ userId: uid, name, avatar }); setProfileVisible(false); setTimeout(() => setChatVisible(true), 350); }}
        onRequestViewUser={uid => setProfileTargetUserId(uid)}
        onPostAsJes={(jesId, type) => {
          if (type === 'post') setJesPostAuthorId(jesId);
          else setJesStoryAuthorId(jesId);
          setProfileVisible(false);
          setTimeout(() => { if (type === 'post') setCreatePostVisible(true); else setCreateStoryVisible(true); }, 700);
        }}
      />
      <ChatModal visible={chatVisible} openWithUserId={chatOpenWith?.userId} openWithName={chatOpenWith?.name} openWithAvatar={chatOpenWith?.avatar} onClose={() => { setChatVisible(false); setChatOpenWith(null); }} />
      <GroupsModal visible={groupsVisible} initialGroupId={groupsInitialId}
        onClose={() => { setGroupsVisible(false); setGroupsInitialId(undefined); }}
        onPostPublished={(post: any) => setGroupPosts(prev => [post, ...prev])} />
      <CreateMenuModal visible={createMenuVisible} onClose={() => setCreateMenuVisible(false)}
        onPost={() => setCreatePostVisible(true)} onStory={() => setCreateStoryVisible(true)} onPoll={() => { setCreateMenuVisible(false); setCreatePollVisible(true); }} />
      <CreatePostModal visible={createPostVisible} authorUserId={jesPostAuthorId}
        onClose={() => { setCreatePostVisible(false); setJesPostAuthorId(undefined); }} onPublished={loadDbPosts} />
      <CreateStoryModal visible={createStoryVisible} onClose={() => { setCreateStoryVisible(false); setJesStoryAuthorId(undefined); }} onPublished={loadStories} authorUserId={jesStoryAuthorId} />
      <CreatePollModal visible={createPollVisible} onClose={() => setCreatePollVisible(false)} />
    </div>
  );
}
