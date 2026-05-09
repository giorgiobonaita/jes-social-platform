'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang, T } from '@/lib/i18n';
import AvatarImg from '@/components/AvatarImg';

export interface UserStoryGroup {
  userId: string; username: string; name: string; avatarUrl: string | null;
  stories: { id: string; imageUrl: string; timeAgo: string }[];
}

interface Props {
  groups: UserStoryGroup[]; initialGroupIndex: number;
  visible: boolean; onClose: () => void;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onStoryDeleted?: (storyId: string) => void;
  onUserPress?: (userId: string) => void;
}

const STORY_DURATION = 5000;

interface Viewer { id: string; username: string; avatarUrl: string | null; }

export default function StoryViewer({ groups, initialGroupIndex, visible, onClose, currentUserId, isAdmin, onStoryDeleted, onUserPress }: Props) {
  const { lang } = useLang();
  const t = (k: string) => T[lang][k] ?? T['en'][k] ?? k;
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  // Views/likes panel
  const [showPanel, setShowPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<'views' | 'likes'>('views');
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [likers, setLikers] = useState<Viewer[]>([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const pausedRef = useRef(false);
  const viewTrackedRef = useRef<string | null>(null);

  // Load current user id + role directly from Supabase session — source of truth
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('users').select('id, role').eq('auth_id', user.id).single();
      if (data) { setMyUserId(data.id); setMyRole(data.role); }
    });
  }, []);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const isOwner = !!(myUserId && group?.userId && group.userId === myUserId);
  const canDelete = isOwner || myRole === 'admin';
  const canSeeStats = canDelete;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRef.current) clearTimeout(autoRef.current);
  }, []);

  const goNext = useCallback(() => {
    setProgress(0); progressRef.current = 0; setIsLiked(false); setShowPanel(false);
    setGroupIdx(g => {
      const grp = groups[g];
      if (!grp) return g;
      setStoryIdx(s => {
        if (s < grp.stories.length - 1) return s + 1;
        if (g < groups.length - 1) { setGroupIdx(g + 1); return 0; }
        onClose(); return s;
      });
      return g;
    });
  }, [groups, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0); progressRef.current = 0; setIsLiked(false); setShowPanel(false);
    if (storyIdx > 0) { setStoryIdx(s => s - 1); return; }
    if (groupIdx > 0) { setGroupIdx(g => g - 1); setStoryIdx(0); }
  }, [storyIdx, groupIdx]);

  const startTimer = useCallback(() => {
    clearTimers();
    progressRef.current = 0; setProgress(0);
    const tick = 50;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      progressRef.current += (tick / STORY_DURATION) * 100;
      setProgress(Math.min(progressRef.current, 100));
      if (progressRef.current >= 100) {
        clearTimers();
        setStoryIdx(s => {
          const grp = groups[groupIdx];
          if (!grp) return s;
          if (s < grp.stories.length - 1) { setIsLiked(false); setShowPanel(false); return s + 1; }
          if (groupIdx < groups.length - 1) { setGroupIdx(g => g + 1); setIsLiked(false); setShowPanel(false); return 0; }
          onClose(); return s;
        });
      }
    }, tick);
  }, [clearTimers, groups, groupIdx, onClose]);

  // Track view + fetch like state
  useEffect(() => {
    if (!visible) { clearTimers(); return; }
    setIsLiked(false); setShowPanel(false);
    progressRef.current = 0; setProgress(0);
    pausedRef.current = false; setPaused(false);
    startTimer();

    if (!story?.id) return;

    // Track view (once per story)
    if (myUserId && viewTrackedRef.current !== story.id) {
      viewTrackedRef.current = story.id;
      supabase.from('story_views').upsert({ story_id: story.id, user_id: myUserId }, { onConflict: 'story_id,user_id' }).then(() => {});
    }

    // Fetch like state
    if (myUserId) {
      supabase.from('story_likes').select('id').eq('story_id', story.id).eq('user_id', myUserId).maybeSingle()
        .then(({ data }) => { if (data) setIsLiked(true); });
    }

    return clearTimers;
  }, [groupIdx, storyIdx, visible, myUserId]); // eslint-disable-line

  // Fetch counts whenever story or user role loads
  useEffect(() => {
    if (!story?.id || !canSeeStats) return;
    supabase.from('story_views').select('id', { count: 'exact', head: true }).eq('story_id', story.id)
      .then(({ count }) => setViewsCount(count || 0));
    supabase.from('story_likes').select('id', { count: 'exact', head: true }).eq('story_id', story.id)
      .then(({ count }) => setLikesCount(count || 0));
  }, [story?.id, canSeeStats]); // eslint-disable-line

  useEffect(() => {
    if (visible) { setGroupIdx(initialGroupIndex); setStoryIdx(0); }
  }, [visible, initialGroupIndex]);

  const openPanel = async (tab: 'views' | 'likes') => {
    if (!story?.id) return;
    setPanelTab(tab);
    setShowPanel(true);
    pausedRef.current = true; setPaused(true);

    if (tab === 'views') {
      const { data } = await supabase.from('story_views').select('user_id, users(id, username, avatar_url)').eq('story_id', story.id).order('created_at', { ascending: false }).limit(100);
      setViewers((data || []).map((r: any) => ({ id: r.users?.id || r.user_id, username: r.users?.username || 'utente', avatarUrl: r.users?.avatar_url || null })));
    } else {
      const { data } = await supabase.from('story_likes').select('user_id, users(id, username, avatar_url)').eq('story_id', story.id).order('created_at', { ascending: false }).limit(100);
      setLikers((data || []).map((r: any) => ({ id: r.users?.id || r.user_id, username: r.users?.username || 'utente', avatarUrl: r.users?.avatar_url || null })));
    }
  };

  const closePanel = () => { setShowPanel(false); pausedRef.current = false; setPaused(false); };

  const handlePause = () => { pausedRef.current = true; setPaused(true); };
  const handleResume = () => { if (!showPanel) { pausedRef.current = false; setPaused(false); } };

  if (!visible || !group || !story) return null;

  return (
    <div className="sv-overlay" onContextMenu={e => e.preventDefault()}>
      <img src={story.imageUrl} alt="" className="sv-img" draggable={false} />
      <div className="sv-grad-top" />
      <div className="sv-grad-bottom" />

      {/* Progress bars */}
      <div className="sv-bars">
        {group.stories.map((_, i) => (
          <div key={i} className="sv-bar-track">
            <div className="sv-bar-fill" style={{ width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%', transition: i === storyIdx ? 'none' : undefined }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="sv-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: onUserPress ? 'pointer' : 'default' }}
          onClick={() => { if (onUserPress) { onClose(); onUserPress(group.userId); } }}>
          <div className="sv-avatar">
            {group.avatarUrl
              ? <img src={group.avatarUrl} alt={group.name} className="sv-avatar-img" />
              : <svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
            }
          </div>
          <div className="sv-info">
            <div className="sv-name">{group.name}</div>
            <div className="sv-time">{story.timeAgo}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canDelete && (
            <button onClick={async () => {
              if (!confirm(t('delete_story_confirm'))) return;
              const deletedId = story.id;
              await supabase.from('stories').delete().eq('id', deletedId);
              onStoryDeleted?.(deletedId);
              if (group.stories.length === 1) { onClose(); return; }
              if (storyIdx < group.stories.length - 1) setStoryIdx(s => s + 1);
              else setStoryIdx(s => s - 1);
            }} style={{ background: 'rgba(255,59,48,0.85)', border: 'none', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
          <button className="sv-close" onClick={onClose}>
            <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Tap zones */}
      <div className="sv-tap-left" onClick={goPrev} onMouseDown={handlePause} onMouseUp={handleResume} onTouchStart={handlePause} onTouchEnd={handleResume} />
      <div className="sv-tap-right" onClick={goNext} onMouseDown={handlePause} onMouseUp={handleResume} onTouchStart={handlePause} onTouchEnd={handleResume} />

      {/* Stats bar — visible only to owner/admin */}
      {canSeeStats && (
        <div style={{ position: 'absolute', bottom: 72, left: 0, right: 0, margin: '0 12px', display: 'flex', gap: 6, zIndex: 5 }}>
          <button onClick={() => openPanel('views')} style={{ flex: 1, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span style={{ color: 'white', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>{viewsCount} Visto da</span>
            <svg style={{ marginLeft: 'auto' }} width="12" height="12" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => openPanel('likes')} style={{ flex: 1, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" fill="#FF7A00" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span style={{ color: 'white', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>{likesCount} Mi piace</span>
            <svg style={{ marginLeft: 'auto' }} width="12" height="12" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="sv-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: 16, paddingRight: 8 }}>
        {/* Like button */}
        <button className="sv-like-btn" onClick={async () => {
          if (!myUserId || !story?.id) { setIsLiked(p => !p); return; }
          const newVal = !isLiked;
          setIsLiked(newVal);
          setLikesCount(p => newVal ? p + 1 : Math.max(0, p - 1));
          if (newVal) {
            await supabase.from('story_likes').upsert({ story_id: story.id, user_id: myUserId }, { onConflict: 'story_id,user_id' });
          } else {
            await supabase.from('story_likes').delete().eq('story_id', story.id).eq('user_id', myUserId);
          }
        }}>
          {isLiked
            ? <svg width="52" height="52" fill="#FF7A00" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            : <svg width="52" height="52" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          }
        </button>
      </div>

      {/* Views/Likes Panel */}
      {showPanel && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(20,20,20,0.97)', borderRadius: '20px 20px 0 0', maxHeight: '60%', display: 'flex', flexDirection: 'column', zIndex: 10 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ width: 36, height: 4, background: '#555', borderRadius: 2, margin: '12px auto 0' }} />
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333', marginTop: 12 }}>
            {(['views', 'likes'] as const).map(tab => (
              <button key={tab} onClick={() => openPanel(tab)} style={{ flex: 1, background: 'none', border: 'none', borderBottom: panelTab === tab ? '2px solid white' : '2px solid transparent', color: panelTab === tab ? 'white' : '#888', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, padding: '10px 0', cursor: 'pointer' }}>
                {tab === 'views' ? `👁 ${viewsCount}` : `❤️ ${likesCount}`}
              </button>
            ))}
            <button onClick={closePanel} style={{ background: 'none', border: 'none', padding: '0 16px', cursor: 'pointer' }}>
              <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 16px 24px' }}>
            {(panelTab === 'views' ? viewers : likers).length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 24 }}>
                {panelTab === 'views' ? 'Nessuna visualizzazione' : 'Nessun like'}
              </p>
            ) : (
              (panelTab === 'views' ? viewers : likers).map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #2a2a2a' }}>
                  <AvatarImg uri={u.avatarUrl} size={38} seed={u.username} style={{ borderRadius: '50%' }} />
                  <span style={{ color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>@{u.username}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
