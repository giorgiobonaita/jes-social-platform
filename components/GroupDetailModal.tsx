'use client';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';
import { useLang, T } from '@/lib/i18n';

const ORANGE = '#F07B1D';

const PARTNER_ADV = [
  { img: '/adv-gb1.png',  url: 'https://www.gbsrl-studioimmobiliare.it/', label: 'GB Studio Immobiliare' },
  { img: '/adv-gb2.png',  url: 'https://www.gbsrl-studioimmobiliare.it/', label: 'GB Studio Immobiliare' },
  { img: '/adv-gb3.png',  url: 'https://www.gbsrl-studioimmobiliare.it/', label: 'GB Studio Immobiliare' },
  { img: '/adv-gng1.png', url: 'mailto:mogideag74@gmail.com',             label: 'G.N.G Agency' },
  { img: '/adv-gng2.png', url: 'mailto:mogideag74@gmail.com',             label: 'G.N.G Agency' },
  { img: '/adv-gng3.png', url: 'mailto:mogideag74@gmail.com',             label: 'G.N.G Agency' },
  { img: '/adv-ges1.png', url: 'https://gescompany.it/',                  label: 'GES Company' },
  { img: '/adv-ges2.png', url: 'https://gescompany.it/',                  label: 'GES Company' },
  { img: '/adv-ges3.png', url: 'https://gescompany.it/',                  label: 'GES Company' },
  { img: '/adv-mer1.png', url: 'https://www.mercury-auctions.com/it_it/index/', label: 'Mercury Auctions' },
  { img: '/adv-mer2.png', url: 'https://www.mercury-auctions.com/it_it/index/', label: 'Mercury Auctions' },
  { img: '/adv-mer3.png', url: 'https://www.mercury-auctions.com/it_it/index/', label: 'Mercury Auctions' },
];

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  coverUrl: string;
  isPrivate?: boolean;
}

interface Post {
  id: string;
  author: string;
  avatarUrl: string | null;
  timeAgo: string;
  text: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  liked: boolean;
  userId?: string;
}

function formatTimeAgo(isoDate: string, nowLabel: string, minSuffix: string, hSuffix: string, dSuffix: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return nowLabel;
  if (m < 60) return `${m} ${minSuffix}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${hSuffix}`;
  return `${Math.floor(h / 24)}${dSuffix}`;
}

// ─── COMPOSE BOX ──────────────────────────────────────────────────────────────
interface ComposeBoxProps {
  myAvatar: string | null;
  myId: string | null;
  groupId: string;
  groupName: string;
  onPublished: (post: any) => void;
}

const ComposeBox = memo(function ComposeBox({ myAvatar, myId, groupId, groupName, onPublished }: ComposeBoxProps) {
  const { t } = useLang();
  const [postText, setPostText]         = useState('');
  const [focused, setFocused]           = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [publishing, setPublishing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(URL.createObjectURL(file));
    (e.target as any)._file = file;
  };

  const publishPost = async () => {
    if (!postText.trim() || !myId || publishing) return;
    setPublishing(true);
    try {
      let imageUrl: string | null = null;
      const fileInput = fileRef.current;
      const file = fileInput ? (fileInput as any)._file as File | undefined : undefined;
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filePath = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(filePath, file, { contentType: file.type, upsert: false });
        if (!upErr) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }
      const { data: post } = await supabase.from('posts').insert({
        user_id: myId, caption: postText.trim(), image_url: imageUrl,
        aspect_ratio: 1, privacy: 'all', group_id: groupId, group_name: groupName,
      }).select('id').single();
      const captionSnapshot = postText.trim();
      setPostText(''); setFocused(false); setSelectedImage(null);
      if (fileRef.current) { fileRef.current.value = ''; (fileRef.current as any)._file = undefined; }
      if (post) {
        onPublished({
          type: 'post', id: post.id,
          author: { name: t('me_label'), username: 'me', avatarUrl: myAvatar || null, discipline: '' },
          imageUrl: imageUrl || '', aspectRatio: 1, likesCount: 0, commentsCount: 0,
          caption: captionSnapshot, timeAgo: t('groups_now'), tags: [], groupName, currentUserId: myId, isLiked: false,
        });
      }
    } catch { alert(t('groups_publish_error')); }
    finally { setPublishing(false); }
  };

  const showActions = focused || postText.trim().length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', backgroundColor: '#fff' }}>
      <AvatarImg uri={myAvatar} size={40} seed="me" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#111', border: '1.5px solid #E8E8E8', borderRadius: 16, padding: '11px 14px', minHeight: 46, lineHeight: '22px', resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          placeholder={t('groups_write_placeholder')}
          value={postText}
          onChange={e => setPostText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { if (!postText.trim()) setFocused(false); }}
          rows={2}
        />
        {selectedImage && (
          <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
            <img src={selectedImage} style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover' }} alt="preview" />
            <button onClick={() => { setSelectedImage(null); if (fileRef.current) { fileRef.current.value = ''; (fileRef.current as any)._file = undefined; } }}
              style={{ position: 'absolute', top: -6, right: -6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5"/></svg>
            </button>
          </div>
        )}
        {showActions && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}>
              <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: ORANGE }}>{t('photo_tool')}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            <button onClick={publishPost} disabled={!postText.trim() || publishing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: postText.trim() && !publishing ? ORANGE : '#E0E0E0', border: 'none', borderRadius: 20, padding: '10px 18px', cursor: postText.trim() && !publishing ? 'pointer' : 'default' }}>
              {publishing
                ? <div className="spin" style={{ width: 16, height: 16 }} />
                : <>
                    <svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#fff' }}>{t('publish')}</span>
                  </>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── GROUP DETAIL ──────────────────────────────────────────────────────────────
interface Props {
  group: Group;
  joined: boolean;
  onBack: () => void;
  onToggleJoin: () => void;
  onPostPublished?: (post: any) => void;
}

export default function GroupDetail({ group, joined, onBack, onToggleJoin, onPostPublished }: Props) {
  const { t, lang } = useLang();
  const tl = (k: string) => T[lang][k] ?? T['en'][k] ?? k;
  const [localJoined, setLocalJoined]       = useState(joined);
  const [posts, setPosts]                   = useState<Post[]>([]);
  const [loading, setLoading]               = useState(false);
  const [myId, setMyId]                     = useState<string | null>(null);
  const [myAvatar, setMyAvatar]             = useState<string | null>(null);
  const [coverUrl, setCoverUrl]             = useState<string>(group.coverUrl || '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalJoined(joined); }, [joined]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id, avatar_url').eq('auth_id', user.id).single();
      if (data) { setMyId(data.id); setMyAvatar(data.avatar_url); }
    })();
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data: rawPosts } = await supabase
      .from('posts').select('id, caption, image_url, created_at, user_id')
      .eq('group_id', group.id).order('created_at', { ascending: false });
    if (!rawPosts || rawPosts.length === 0) { setLoading(false); return; }

    const userIds = [...new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean))];
    const { data: usersData } = await supabase.from('users').select('id, name, username, avatar_url').in('id', userIds);
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });

    const postIds = rawPosts.map((p: any) => p.id);
    const [{ data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id').in('post_id', postIds),
    ]);
    const likesByPost: Record<string, string[]> = {};
    (likesData || []).forEach((l: any) => {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l.user_id);
    });
    const commentsByPost: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => { commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1; });

    const nowLabel = t('groups_now');
    setPosts(rawPosts.map((p: any) => {
      const u = userMap[p.user_id] || {};
      return {
        id: p.id, author: u.name || u.username || t('role_user_title'), avatarUrl: u.avatar_url || null,
        timeAgo: formatTimeAgo(p.created_at, nowLabel, tl('notif_mins_ago'), tl('time_h_ago'), tl('time_d_ago')), text: p.caption || '', imageUrl: p.image_url || undefined,
        likes: (likesByPost[p.id] || []).length, comments: commentsByPost[p.id] || 0,
        liked: myId ? (likesByPost[p.id] || []).includes(myId) : false, userId: p.user_id,
      };
    }));
    setLoading(false);
  }, [group.id, myId, t]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `posts/cover_${group.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(filePath, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const url = data.publicUrl;
      await supabase.from('groups').update({ cover_url: url }).eq('id', group.id);
      setCoverUrl(url);
    } catch { alert(t('groups_cover_error')); }
    finally { setUploadingCover(false); }
  };

  const handleToggleJoin = () => { setLocalJoined(p => !p); onToggleJoin(); };

  const handlePostPublished = useCallback((post: any) => {
    loadPosts(); onPostPublished?.(post);
  }, [loadPosts, onPostPublished]);

  const toggleLike = async (id: string, userId?: string) => {
    if (!myId) return;
    const post = posts.find(p => p.id === id);
    const isLiked = post?.liked ?? false;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', myId);
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: myId });
      if (userId && userId !== myId) {
        await supabase.from('notifications').insert({ user_id: userId, sender_id: myId, type: 'like', post_id: id });
      }
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F5F5F5' }}>
      {/* Cover */}
      <div style={{ position: 'relative', width: '100%', height: 210 }}>
        {coverUrl
          ? <img src={coverUrl} style={{ width: '100%', height: 210, objectFit: 'cover', display: 'block' }} alt={group.name} />
          : <div style={{ width: '100%', height: 210, backgroundColor: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="60" height="60" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.22)' }} />
        <button onClick={onBack}
          style={{ position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(52,199,89,0.92)', padding: '5px 12px', borderRadius: 14 }}>
          <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#fff' }}>{t('groups_public')}</span>
        </div>
        {localJoined && (
          <button onClick={() => coverInputRef.current?.click()}
            style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.52)', border: 'none', borderRadius: 14, padding: '7px 12px', cursor: 'pointer' }}>
            {uploadingCover
              ? <div className="spin" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
              : <>
                  <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#fff' }}>{t('groups_cover_btn')}</span>
                </>
            }
          </button>
        )}
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
      </div>

      {/* Info box */}
      <div style={{ backgroundColor: '#fff', padding: '18px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, color: '#111', display: 'block', marginBottom: 6 }}>{group.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>{group.members.toLocaleString()} {t('groups_members')}</span>
              {localJoined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: '#34C75918', padding: '3px 8px', borderRadius: 10 }}>
                  <svg width="13" height="13" fill="#34C759" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#34C759' }}>{t('groups_member')}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleToggleJoin}
            style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: localJoined ? '#F0F0F0' : ORANGE, border: 'none', borderRadius: 22, padding: '10px 16px', cursor: 'pointer' }}>
            <svg width="16" height="16" fill="none" stroke={localJoined ? '#888' : '#fff'} strokeWidth="2.2" viewBox="0 0 24 24">
              {localJoined ? <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></> : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
            </svg>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: localJoined ? 600 : 700, fontSize: 14, color: localJoined ? '#888' : '#fff' }}>{localJoined ? t('groups_leave') : t('groups_join')}</span>
          </button>
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#666', lineHeight: '21px' }}>{group.description}</span>
      </div>

      {/* Separator */}
      <div style={{ height: 8, backgroundColor: '#F0F0F0' }} />

      {/* Sponsor gallery — solo per il gruppo Partner */}
      {group.name === 'Partner' && (
        <div style={{ backgroundColor: '#fff', paddingBottom: 8 }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" fill="none" stroke={ORANGE} strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#111' }}>{tl('sponsor_jes')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 2px' }}>
            {PARTNER_ADV.map((adv, i) => (
              <a key={i} href={adv.url} target={adv.url.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
                style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
                <img src={adv.img} alt={adv.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {group.name === 'Partner' && <div style={{ height: 8, backgroundColor: '#F0F0F0' }} />}

      {/* Compose or join banner */}
      {localJoined ? (
        <ComposeBox myAvatar={myAvatar} myId={myId} groupId={group.id} groupName={group.name} onPublished={handlePostPublished} />
      ) : (
        <button onClick={handleToggleJoin} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 14, padding: 16, backgroundColor: '#FFF8F3', border: `1.5px solid ${ORANGE}40`, borderRadius: 18, cursor: 'pointer', width: 'calc(100% - 28px)', textAlign: 'left' }}>
          <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 3 }}>{t('groups_join_to_post')}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>{t('groups_join_to_post_sub')}</div>
          </div>
          <div style={{ backgroundColor: ORANGE, padding: '9px 14px', borderRadius: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#fff' }}>{t('groups_join')}</span>
          </div>
        </button>
      )}

      {/* Feed header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', backgroundColor: '#F5F5F5' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#AAA', flex: 1 }}>{t('groups_post_header')}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#CCC' }}>{posts.length}</span>
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
      ) : posts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 10 }}>
          <svg width="40" height="40" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAA' }}>{t('groups_no_posts')}</span>
        </div>
      ) : (
        posts.map(item => (
          <div key={item.id} style={{ backgroundColor: '#fff', marginBottom: 8, padding: '16px 16px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AvatarImg uri={item.avatarUrl} size={42} seed={item.author} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111', display: 'block' }}>{item.author}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA' }}>{item.timeAgo}</span>
              </div>
              <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#222', lineHeight: '23px', display: 'block', marginBottom: 12 }}>{item.text}</span>
            {item.imageUrl && <img src={item.imageUrl} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 12, display: 'block' }} alt="" />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, paddingTop: 10, paddingBottom: 10, borderTop: '1px solid #F5F5F5' }}>
              <button onClick={() => toggleLike(item.id, item.userId)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="21" height="21" fill={item.liked ? ORANGE : 'none'} stroke={item.liked ? ORANGE : '#999'} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: item.liked ? ORANGE : '#999' }}>{item.likes}</span>
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="19" height="19" fill="none" stroke="#999" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#999' }}>{item.comments}</span>
              </button>
            </div>
          </div>
        ))
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}
