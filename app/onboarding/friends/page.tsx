'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface RealUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  discipline: string | null;
  role: string | null;
}

export default function OnboardingFriendsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedFriends, setAddedFriends] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let myId: string | null = null;
        if (user) {
          const { data: me } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
          myId = me?.id ?? null;
          setCurrentUserId(myId);
        }
        const { data } = await supabase.from('users')
          .select('id, name, username, avatar_url, discipline, role')
          .order('created_at', { ascending: false }).limit(30);
        if (data) setUsers(data.filter((u: RealUser) => u.id !== myId));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const toggleFriend = (id: string) => {
    const wasAdded = !!addedFriends[id];
    setAddedFriends(prev => ({ ...prev, [id]: !wasAdded }));
    if (!wasAdded && currentUserId) {
      supabase.from('follows').insert({ follower_id: currentUserId, following_id: id }).then(() => {});
    } else if (wasAdded && currentUserId) {
      supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', id).then(() => {});
    }
  };

  return (
    <div className="shell friends-page">
      <div style={{ padding: '24px 20px 20px' }}>
        <h1 className="onb-title lg" style={{ marginBottom: 8 }}>Trova amici</h1>
        <p className="onb-subtitle" style={{ textAlign: 'left' }}>
          Connettiti con persone che condividono le tue <strong style={{ color: '#F07B1D' }}>stesse passioni</strong>.
        </p>
      </div>

      <div className="friends-list">
        {loading ? (
          <div className="spinner"><div className="spin" /></div>
        ) : users.length === 0 ? (
          <p className="empty-text">Nessun altro utente ancora</p>
        ) : (
          users.map(user => {
            const isAdded = !!addedFriends[user.id];
            const isOfficial = user.role === 'official' || user.role === 'admin';
            return (
              <div key={user.id} className="user-card">
                <div className="avatar" style={{ width: 48, height: 48 }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt={user.name} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    : <svg width="24" height="24" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  }
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user.name || user.username}
                    {isOfficial && <span style={{ color: '#007AFF', fontSize: 14 }}>✓</span>}
                  </div>
                  <div className="user-role">{user.discipline || 'Artista'}</div>
                </div>
                <button className={`follow-btn${isAdded ? ' added' : ''}`} onClick={() => toggleFriend(user.id)}>
                  {isAdded ? 'Inviata' : (
                    <><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: 4 }}><path d="M15 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>Segui</>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="sticky-bottom">
        <button className="btn-primary" onClick={() => router.replace('/home')}>
          Continua
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
