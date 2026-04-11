'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CommentsModal from '@/components/CommentsModal';
import CreateMenuModal from '@/components/CreateMenuModal';
import CreatePostModal from '@/components/CreatePostModal';
import CreateStoryModal from '@/components/CreateStoryModal';
import StoryViewer from '@/components/StoryViewer';
import SearchModal from '@/components/SearchModal';
import NotificationsModal from '@/components/NotificationsModal';
import ProfileModal from '@/components/ProfileModal';
import ChatModal from '@/components/ChatModal';
import GroupsModal from '@/components/GroupsModal';

const ORANGE = '#F07B1D';

const ADV_SPONSORS = [
  { imageUrl: 'https://cunftokrdqvprepcnlum.supabase.co/storage/v1/object/public/media/adv/adv1.png', url: 'https://www.gbsrl-studioimmobiliare.it/' },
  { imageUrl: 'https://cunftokrdqvprepcnlum.supabase.co/storage/v1/object/public/media/adv/adv2.png', url: 'https://gescompany.it/' },
  { imageUrl: 'https://cunftokrdqvprepcnlum.supabase.co/storage/v1/object/public/media/adv/adv3.png', url: 'https://www.mercury-auctions.com/' },
];

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  return `${Math.floor(h / 24)} g fa`;
}

function buildFeed(posts: any[]): any[] {
  const feed: any[] = [];
  let advIdx = 0;
  posts.forEach((p, i) => {
    feed.push(p);
    if ((i + 1) % 4 === 0 && ADV_SPONSORS.length > 0) {
      const sp = ADV_SPONSORS[advIdx % ADV_SPONSORS.length];
      feed.push({ type: 'adv', id: `adv_${advIdx}`, imageUrl: sp.imageUrl, url: sp.url });
      advIdx++;
    }
  });
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
            {avatarUrl
              ? <img src={avatarUrl} alt={username} width={62} height={62} style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius: '50%' }} />
              : <svg width="28" height="28" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            }
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

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserAvatar, onComment, onUserPress, onDelete, isAdmin }: {
  post: any; currentUserAvatar?: string | null;
  onComment: () => void; onUserPress: (id: string) => void;
  onDelete: () => void; isAdmin: boolean;
}) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const isOfficial = post.author?.role === 'official' || post.author?.role === 'admin';

  const toggleLike = async () => {
    setLiked((p: boolean) => !p);
    setLikesCount((p: number) => liked ? p - 1 : p + 1);
    if (!post.currentUserId) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', post.currentUserId);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: post.currentUserId });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Eliminare questo post?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    onDelete();
  };

  const canDelete = isAdmin || post.userId === post.currentUserId;

  return (
    <div>
      <div className="post-card">
        <div className="post-header" style={{ cursor: 'pointer' }} onClick={() => onUserPress(post.userId)}>
          <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
            {post.author?.avatarUrl
              ? <img src={post.author.avatarUrl} alt={post.author.name} width={40} height={40} style={{ objectFit: 'cover', borderRadius: '50%' }} />
              : <svg width="20" height="20" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            }
          </div>
          <div className="post-author">
            <div className="post-author-name">
              {post.author?.name || 'Utente'}
              {isOfficial && <span style={{ color: '#007AFF', fontSize: 13 }}>✓</span>}
            </div>
            <div className="post-author-meta">
              @{post.author?.username} · {post.timeAgo}
              {post.groupName && <> · <span style={{ color: ORANGE }}>{post.groupName}</span></>}
            </div>
          </div>
          {canDelete && (
            <button className="post-more" onClick={e => { e.stopPropagation(); handleDelete(); }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
            </button>
          )}
        </div>

        {post.imageUrls && post.imageUrls.length > 0 && (
          <img className="post-image" src={post.imageUrls[0]} alt="post" loading="lazy" />
        )}

        <div className="post-actions">
          <button className={`post-action-btn${liked ? ' liked' : ''}`} onClick={toggleLike}>
            {liked
              ? <svg width="22" height="22" fill="#E03131" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              : <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            }
            <span style={{ fontSize: 13, fontWeight: 600 }}>{likesCount > 0 ? likesCount : ''}</span>
          </button>
          <button className="post-action-btn" onClick={onComment}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
          </button>
          <button className="post-action-btn" onClick={() => navigator.share?.({ url: window.location.href })}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
        </div>

        {post.caption && (
          <p className="post-caption"><strong>{post.author?.username}</strong> {post.caption}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 8 }}>
            {post.tags.map((tag: string) => <span key={tag} className="post-tag">#{tag}</span>)}
          </div>
        )}
      </div>
      <div className="post-divider" />
    </div>
  );
}

// ── ADV Card ──────────────────────────────────────────────────────────────────
function AdvCard({ imageUrl, url }: { imageUrl: string; url: string }) {
  return (
    <div className="adv-card" style={{ cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
      <div style={{ display: 'flex' }}>
        <div className="adv-badge">
          <svg width="11" height="11" fill="none" stroke="#888" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span className="adv-badge-text">SPONSORIZZATO</span>
        </div>
      </div>
      <img className="adv-img" src={imageUrl} alt="sponsor" loading="lazy" />
      <div className="adv-footer">
        <div className="adv-link-btn">
          <span className="adv-link-text">Visita il link</span>
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<UserStoryGroup[]>([]);

  const [storyVisible, setStoryVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAuthorId, setCommentsAuthorId] = useState<string | null>(null);

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
  const [jesPostAuthorId, setJesPostAuthorId] = useState<string | undefined>();

  const allPosts = useMemo(() => [...groupPosts, ...dbPosts], [groupPosts, dbPosts]);
  const feedData = useMemo(() => buildFeed(allPosts), [allPosts]);

  // Load current user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }
      const { data } = await supabase.from('users').select('id, avatar_url, role').eq('auth_id', user.id).single();
      if (data) {
        setCurrentUserId(data.id);
        setCurrentUserAvatar(data.avatar_url || null);
        setIsAdmin(data.role === 'admin');
        const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', data.id).eq('read', false);
        setHasUnread((count || 0) > 0);
      }
    })();
  }, [router]);

  const loadDbPosts = useCallback(async () => {
    const { data: posts, error } = await supabase
      .from('posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (error || !posts || posts.length === 0) return;

    const postIds = posts.map((p: any) => p.id);
    const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];
    const [{ data: usersData }, { data: tagsData }, { data: likesData }, { data: commentsData }, authResult] =
      await Promise.all([
        supabase.from('users').select('id, username, name, avatar_url, discipline, role').in('id', userIds),
        supabase.from('post_tags').select('post_id, tag').in('post_id', postIds),
        supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('comments').select('id, post_id').in('post_id', postIds),
        supabase.auth.getUser(),
      ]);

    let dbUserId: string | null = null;
    if (authResult.data.user) {
      const { data: u } = await supabase.from('users').select('id').eq('auth_id', authResult.data.user.id).single();
      dbUserId = u?.id ?? null;
    }

    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });
    const tagsByPost: Record<string, string[]> = {};
    (tagsData || []).forEach((t: any) => { if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = []; tagsByPost[t.post_id].push(t.tag); });
    const likesByPost: Record<string, string[]> = {};
    (likesData || []).forEach((l: any) => { if (!likesByPost[l.post_id]) likesByPost[l.post_id] = []; likesByPost[l.post_id].push(l.user_id); });
    const commentsByPost: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => { commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1; });

    setDbPosts(posts.map((p: any) => {
      const u = userMap[p.user_id] || {};
      const imageUrls: string[] = Array.isArray(p.image_urls) && p.image_urls.length > 0
        ? p.image_urls : p.image_url ? [p.image_url] : [];
      return {
        type: p.type || 'post', id: p.id, userId: p.user_id,
        author: { name: u.name || 'Utente', username: u.username || 'utente', avatarUrl: u.avatar_url || null, discipline: u.discipline || '', role: u.role || null },
        imageUrls, aspectRatio: p.aspect_ratio || 1,
        likesCount: (likesByPost[p.id] || []).length,
        commentsCount: commentsByPost[p.id] || 0,
        isLiked: dbUserId ? (likesByPost[p.id] || []).includes(dbUserId) : false,
        currentUserId: dbUserId,
        caption: p.caption || '',
        timeAgo: formatTimeAgo(p.created_at),
        tags: tagsByPost[p.id] || [],
        groupName: p.group_name || undefined,
      };
    }));
  }, []);

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
        groupMap[s.user_id] = { userId: s.user_id, username: u.username || 'utente', name: u.name || 'Utente', avatarUrl: u.avatar_url || null, stories: [] };
      }
      groupMap[s.user_id].stories.push({ id: s.id, imageUrl: s.image_url, timeAgo: formatTimeAgo(s.created_at) });
    });
    setStories(Object.values(groupMap));
  }, []);

  useEffect(() => { loadDbPosts(); loadStories(); }, [loadDbPosts, loadStories]);

  // Realtime
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase.channel('web:updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, loadDbPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, loadDbPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, loadStories)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUserId}` }, () => setHasUnread(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadDbPosts, loadStories]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <div className="shell home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-side">
          <button className="icon-btn" onClick={() => setChatVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
          <button className="icon-btn" onClick={() => setSearchVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>

        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: ORANGE, letterSpacing: -1 }}>JES</span>

        <div className="header-side">
          <button className="icon-btn" onClick={() => setGroupsVisible(true)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </button>
          <button className="icon-btn" onClick={() => { setNotifVisible(true); setHasUnread(false); }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            {hasUnread && <div className="notif-badge" />}
          </button>
        </div>
      </header>

      {/* Feed */}
      <div className="feed-scroll">
        {/* Stories */}
        <div className="stories-section">
          <p className="stories-label">Seguiti</p>
          <div className="stories-row">
            <StoryRing id="create" username="La tua storia" avatarUrl={currentUserAvatar} isCustom onPress={() => setCreateStoryVisible(true)} />
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
          return (
            <PostCard
              key={item.id} post={item}
              currentUserAvatar={currentUserAvatar}
              onComment={() => { setCommentsPostId(item.id); setCommentsAuthorId(item.userId); setCommentsVisible(true); }}
              onUserPress={(uid) => { setProfileTargetUserId(uid); setProfileVisible(true); }}
              onDelete={() => setDbPosts(prev => prev.filter(p => p.id !== item.id))}
              isAdmin={isAdmin}
            />
          );
        })}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <button className="nav-tab" onClick={() => {}}>
          <svg width="26" height="26" fill={ORANGE} viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </button>
        <button className="nav-tab" onClick={() => setCreateMenuVisible(true)}>
          <div className="create-circle">
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </button>
        <button className="nav-tab" onClick={() => { setProfileTargetUserId(undefined); setProfileVisible(true); }}>
          <svg width="26" height="26" fill="none" stroke="#AAAAAA" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </button>
      </nav>

      {/* Modals */}
      <StoryViewer groups={stories} initialGroupIndex={activeStoryIndex} visible={storyVisible} onClose={() => setStoryVisible(false)} />
      <CommentsModal visible={commentsVisible} postId={commentsPostId} postAuthorId={commentsAuthorId} onClose={() => { setCommentsVisible(false); setCommentsPostId(null); setCommentsAuthorId(null); }} />
      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)}
        onUserPress={uid => { setProfileTargetUserId(uid); setProfileVisible(true); }}
        onGroupPress={gid => { setGroupsInitialId(gid); setGroupsVisible(true); }}
        onPostPress={(_, url) => {}} />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <ProfileModal visible={profileVisible} targetUserId={profileTargetUserId}
        onClose={() => { setProfileVisible(false); setProfileTargetUserId(undefined); }}
        onMessagePress={(uid, name, avatar) => { setChatOpenWith({ userId: uid, name, avatar }); setProfileVisible(false); setTimeout(() => setChatVisible(true), 350); }}
        onRequestViewUser={uid => setProfileTargetUserId(uid)}
        onPostAsJes={(jesId, type) => { if (type === 'post') setJesPostAuthorId(jesId); setProfileVisible(false); setTimeout(() => setCreatePostVisible(true), 700); }}
      />
      <ChatModal visible={chatVisible} openWithUserId={chatOpenWith?.userId} openWithName={chatOpenWith?.name} openWithAvatar={chatOpenWith?.avatar} onClose={() => { setChatVisible(false); setChatOpenWith(null); }} />
      <GroupsModal visible={groupsVisible} initialGroupId={groupsInitialId}
        onClose={() => { setGroupsVisible(false); setGroupsInitialId(undefined); }}
        onPostPublished={(post: any) => setGroupPosts(prev => [post, ...prev])} />
      <CreateMenuModal visible={createMenuVisible} onClose={() => setCreateMenuVisible(false)}
        onPost={() => setCreatePostVisible(true)} onStory={() => setCreateStoryVisible(true)} onPoll={() => {}} />
      <CreatePostModal visible={createPostVisible} authorUserId={jesPostAuthorId}
        onClose={() => { setCreatePostVisible(false); setJesPostAuthorId(undefined); }} onPublished={loadDbPosts} />
      <CreateStoryModal visible={createStoryVisible} onClose={() => setCreateStoryVisible(false)} onPublished={loadStories} />
    </div>
  );
}
