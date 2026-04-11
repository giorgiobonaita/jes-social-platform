'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean; onClose: () => void;
  targetUserId?: string;
  onMessagePress: (userId: string, name: string, avatar: string | null) => void;
  onRequestViewUser: (userId: string) => void;
  onPostAsJes: (jesUserId: string, type: 'post' | 'story') => void;
}

export default function ProfileModal({ visible, onClose, targetUserId, onMessagePress, onRequestViewUser, onPostAsJes }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsCount, setFollowsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (data) setCurrentDbUserId(data.id);
    })();
  }, []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      const uid = targetUserId || currentDbUserId;
      if (!uid) { setLoading(false); return; }

      const [{ data: u }, { data: p }, { count: fc }, { count: flc }, { data: followData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', uid).single(),
        supabase.from('posts').select('id, image_urls, image_url').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', uid),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', uid),
        currentDbUserId ? supabase.from('follows').select('id').eq('follower_id', currentDbUserId).eq('following_id', uid).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      setProfile(u);
      setPosts(p || []);
      setFollowsCount(fc || 0);
      setFollowersCount(flc || 0);
      setIsFollowing(!!followData);
      setLoading(false);
    })();
  }, [visible, targetUserId, currentDbUserId]);

  const toggleFollow = async () => {
    if (!currentDbUserId || !profile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentDbUserId).eq('following_id', profile.id);
      setIsFollowing(false); setFollowersCount(p => p - 1);
    } else {
      await supabase.from('follows').insert({ follower_id: currentDbUserId, following_id: profile.id });
      setIsFollowing(true); setFollowersCount(p => p + 1);
    }
  };

  const isSelf = !targetUserId || targetUserId === currentDbUserId;
  const isOfficial = profile?.role === 'official' || profile?.role === 'admin';

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0, padding: 0, borderRadius: '24px 24px 0 0' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#111' }}>
            {profile ? `@${profile.username}` : 'Profilo'}
          </span>
          <div style={{ width: 36 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
          {loading ? (
            <div className="spinner" style={{ marginTop: 60 }}><div className="spin" /></div>
          ) : !profile ? (
            <p className="empty-text">Profilo non trovato</p>
          ) : (
            <>
              {/* Avatar + info */}
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#EEE', flexShrink: 0 }}>
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt={profile.name} width={72} height={72} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                      : <svg width="36" height="36" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {profile.name || profile.username}
                      {isOfficial && <span style={{ color: '#007AFF' }}>✓</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#888' }}>
                      {profile.discipline || 'Artista'}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="profile-stats" style={{ marginBottom: 16 }}>
                  <div className="stat-item"><div className="stat-num">{posts.length}</div><div className="stat-label">Post</div></div>
                  <div className="stat-item"><div className="stat-num">{followersCount}</div><div className="stat-label">Follower</div></div>
                  <div className="stat-item"><div className="stat-num">{followsCount}</div><div className="stat-label">Seguiti</div></div>
                </div>

                {profile.bio && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#444', lineHeight: '20px', marginBottom: 16 }}>{profile.bio}</p>
                )}

                {/* Buttons */}
                {!isSelf && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <button className={`btn-primary${isFollowing ? '' : ''}`}
                      onClick={toggleFollow}
                      style={{ background: isFollowing ? '#F0F0F0' : '#F07B1D', color: isFollowing ? '#888' : '#FFF', height: 40, fontSize: 14, borderRadius: 10 }}>
                      {isFollowing ? 'Che segui' : 'Segui'}
                    </button>
                    <button className="btn-secondary"
                      style={{ height: 40, fontSize: 14, borderRadius: 10 }}
                      onClick={() => { onMessagePress(profile.id, profile.name || profile.username, profile.avatar_url); onClose(); }}>
                      Messaggio
                    </button>
                  </div>
                )}
              </div>

              {/* Grid posts */}
              {posts.length > 0 && (
                <div className="profile-grid">
                  {posts.map(p => {
                    const img = (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url;
                    return img ? (
                      <img key={p.id} className="profile-grid-img" src={img} alt="" loading="lazy" />
                    ) : (
                      <div key={p.id} style={{ background: '#F0F0F0', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" fill="#CCC" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
