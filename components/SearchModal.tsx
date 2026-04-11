'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, JES_OFFICIAL_USERNAME } from '@/lib/supabase';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';

interface SearchUser  { id: string; name: string; username: string; avatarUrl: string | null; discipline: string; }
interface SearchPost  { id: string; caption: string; imageUrl: string; username: string; avatarUrl: string | null; userId: string; }
interface SearchGroup { id: string; name: string; memberCount: number; isPrivate: boolean; coverUrl: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
  onGroupPress?: (groupId: string) => void;
  onPostPress?: (postId: string, imageUrl: string) => void;
}

export default function SearchModal({ visible, onClose, onUserPress, onGroupPress, onPostPress }: Props) {
  const [query, setQuery]               = useState('');
  const [tab, setTab]                   = useState<'utenti' | 'post' | 'gruppi'>('utenti');
  const [users, setUsers]               = useState<SearchUser[]>([]);
  const [posts, setPosts]               = useState<SearchPost[]>([]);
  const [groups, setGroups]             = useState<SearchGroup[]>([]);
  const [loading, setLoading]           = useState(false);
  const [myId, setMyId]                 = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds]       = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!data) return;
      setMyId(data.id);
      const [{ data: follows }, { data: memberships }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', data.id),
        supabase.from('group_members').select('group_id').eq('user_id', data.id),
      ]);
      setFollowingIds(new Set((follows || []).map((f: any) => f.following_id)));
      setJoinedIds(new Set((memberships || []).map((m: any) => m.group_id)));
    })();
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [visible]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); setPosts([]); setGroups([]); return; }
    setLoading(true);
    const pattern = `%${q}%`;
    const [{ data: uData }, { data: pData }, { data: gData }] = await Promise.all([
      supabase.from('users').select('id, name, username, avatar_url, discipline')
        .or(`username.ilike.${pattern},name.ilike.${pattern}`).limit(20),
      supabase.from('posts').select('id, caption, image_url, user_id').ilike('caption', pattern).limit(20),
      supabase.from('groups').select('id, name, cover_url, is_private').ilike('name', pattern).limit(20),
    ]);

    setUsers((uData || []).map((u: any) => ({
      id: u.id, name: u.name || 'Utente', username: u.username || '',
      avatarUrl: u.avatar_url || null, discipline: u.discipline || '',
    })));

    const postList = pData || [];
    const authorIds = [...new Set(postList.map((p: any) => p.user_id).filter(Boolean))];
    const authorMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds as string[]);
      (authors || []).forEach((a: any) => { authorMap[a.id] = a; });
    }
    setPosts(postList.map((p: any) => ({
      id: p.id, caption: p.caption || '', imageUrl: p.image_url || '',
      userId: p.user_id, username: authorMap[p.user_id]?.username || 'utente', avatarUrl: authorMap[p.user_id]?.avatar_url || null,
    })));

    const groupList = gData || [];
    const groupIds = groupList.map((g: any) => g.id);
    const memberCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: members } = await supabase.from('group_members').select('group_id').in('group_id', groupIds);
      (members || []).forEach((m: any) => { memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1; });
    }
    setGroups(groupList.map((g: any) => ({
      id: g.id, name: g.name || '', memberCount: memberCounts[g.id] || 0, isPrivate: g.is_private || false, coverUrl: g.cover_url || '',
    })));

    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const toggleFollow = async (userId: string) => {
    if (!myId) return;
    const isFollowing = followingIds.has(userId);
    setFollowingIds(prev => { const next = new Set(prev); isFollowing ? next.delete(userId) : next.add(userId); return next; });
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId });
      await supabase.from('notifications').insert({ user_id: userId, sender_id: myId, type: 'follow' });
    }
  };

  const toggleJoinGroup = async (groupId: string) => {
    if (!myId) return;
    const isJoined = joinedIds.has(groupId);
    setJoinedIds(prev => { const next = new Set(prev); isJoined ? next.delete(groupId) : next.add(groupId); return next; });
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', myId);
    } else {
      await supabase.from('group_members').insert({ group_id: groupId, user_id: myId });
    }
  };

  if (!visible) return null;

  const TABS: Array<'utenti' | 'post' | 'gruppi'> = ['utenti', 'post', 'gruppi'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #F0F0F0', gap: 12 }}>
        <button onClick={onClose} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, padding: '10px 12px', gap: 8 }}>
          <svg width="18" height="18" fill="none" stroke="#AAAAAA" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: '#111' }}
            placeholder="Cerca utenti, opere, gruppi…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#AAAAAA' }}>
              <svg width="18" height="18" fill="#AAAAAA" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '13px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? ORANGE : 'transparent'}`, cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: tab === t ? ORANGE : '#AAAAAA' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
        ) : (
          <>
            {/* UTENTI */}
            {tab === 'utenti' && (
              users.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? 'Nessun utente trovato' : 'Cerca un utente…'}</span></div>
                : users.map(item => {
                    const following = followingIds.has(item.id);
                    const isMe = item.id === myId;
                    return (
                      <div key={item.id} onClick={() => { if (onUserPress) { onClose(); onUserPress(item.id); } }}
                        style={{ display: 'flex', alignItems: 'center', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F6F6F6', cursor: 'pointer' }}>
                        <AvatarImg uri={item.avatarUrl} size={48} seed={item.username} />
                        <div style={{ flex: 1, marginLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#111' }}>{item.name}</span>
                            {item.username === JES_OFFICIAL_USERNAME && (
                              <svg width="14" height="14" fill={ORANGE} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            )}
                          </div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>@{item.username}{item.discipline ? ` · ${item.discipline}` : ''}</span>
                        </div>
                        {!isMe && (
                          <button onClick={e => { e.stopPropagation(); toggleFollow(item.id); }}
                            style={{ border: `1.5px solid ${ORANGE}`, borderRadius: 20, padding: '6px 14px', backgroundColor: following ? ORANGE : 'transparent', cursor: 'pointer' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: following ? '#fff' : ORANGE }}>{following ? '✓ Seguito' : 'Segui'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })
            )}

            {/* POST */}
            {tab === 'post' && (
              posts.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? 'Nessun post trovato' : 'Cerca un post…'}</span></div>
                : posts.map(item => (
                    <div key={item.id} onClick={() => { if (onPostPress && item.imageUrl) { onClose(); onPostPress(item.id, item.imageUrl); } }}
                      style={{ display: 'flex', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F6F6F6', cursor: onPostPress ? 'pointer' : 'default' }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt="" />
                        : <div style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="28" height="28" fill="none" stroke="#CCC" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <AvatarImg uri={item.avatarUrl} size={20} seed={item.username} />
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#888' }}>@{item.username}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#111', lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.caption}</span>
                      </div>
                    </div>
                  ))
            )}

            {/* GRUPPI */}
            {tab === 'gruppi' && (
              groups.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? 'Nessun gruppo trovato' : 'Cerca un gruppo…'}</span></div>
                : groups.map(item => {
                    const joined = joinedIds.has(item.id);
                    return (
                      <div key={item.id} onClick={() => { if (onGroupPress) { onClose(); onGroupPress(item.id); } }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}>
                        {item.coverUrl
                          ? <img src={item.coverUrl} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} alt="" />
                          : <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="22" height="22" fill="none" stroke="#CCC" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                            </div>
                        }
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111', display: 'block', marginBottom: 4 }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <svg width="12" height="12" fill="none" stroke="#AAA" strokeWidth="1.8" viewBox="0 0 24 24">
                              {item.isPrivate
                                ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                                : <circle cx="12" cy="12" r="10"/>}
                            </svg>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA' }}>{item.isPrivate ? 'Privato' : 'Pubblico'} · {item.memberCount.toLocaleString()} membri</span>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleJoinGroup(item.id); }}
                          style={{ border: `1.5px solid ${ORANGE}`, borderRadius: 16, padding: '6px 12px', backgroundColor: joined ? ORANGE : 'transparent', cursor: 'pointer', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: joined ? '#fff' : ORANGE }}>{joined ? '✓ Iscritto' : 'Iscriviti'}</span>
                        </button>
                      </div>
                    );
                  })
            )}
          </>
        )}
      </div>
    </div>
  );
}
