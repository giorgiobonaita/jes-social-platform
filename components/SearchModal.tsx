'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, JES_OFFICIAL_USERNAME } from '@/lib/supabase';
import AvatarImg from './AvatarImg';
import { useLang } from '@/lib/i18n';

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
  const { t } = useLang();
  const [query, setQuery]               = useState('');
  const [tab, setTab]                   = useState<'utenti' | 'post' | 'gruppi'>('utenti');
  const [users, setUsers]               = useState<SearchUser[]>([]);
  const [posts, setPosts]               = useState<SearchPost[]>([]);
  const [groups, setGroups]             = useState<SearchGroup[]>([]);
  const [loading, setLoading]           = useState(false);
  const [myId, setMyId]                 = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds]       = useState<Set<string>>(new Set());
  const [suggestedUsers,  setSuggestedUsers]  = useState<SearchUser[]>([]);
  const [suggestedPosts,  setSuggestedPosts]  = useState<SearchPost[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SearchGroup[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSuggestions = async (uid: string) => {
    const [{ data: uData }, { data: pData }, { data: gData }] = await Promise.all([
      supabase.from('users').select('id, name, username, avatar_url, discipline').neq('id', uid).limit(12),
      supabase.from('posts').select('id, caption, image_url, user_id').not('image_url', 'is', null).order('created_at', { ascending: false }).limit(12),
      supabase.from('groups').select('id, name, cover_url, is_private').limit(12),
    ]);
    setSuggestedUsers((uData || []).map((u: any) => ({ id: u.id, name: u.name || t('role_user_title'), username: u.username || '', avatarUrl: u.avatar_url || null, discipline: u.discipline || '' })));
    const postList = pData || [];
    const aIds = [...new Set(postList.map((p: any) => p.user_id).filter(Boolean))];
    const aMap: Record<string, any> = {};
    if (aIds.length > 0) { const { data: au } = await supabase.from('users').select('id, username, avatar_url').in('id', aIds as string[]); (au || []).forEach((a: any) => { aMap[a.id] = a; }); }
    setSuggestedPosts(postList.map((p: any) => ({ id: p.id, caption: p.caption || '', imageUrl: p.image_url || '', userId: p.user_id, username: aMap[p.user_id]?.username || 'utente', avatarUrl: aMap[p.user_id]?.avatar_url || null })));
    const gList = gData || [];
    const gIds = gList.map((g: any) => g.id);
    const mc: Record<string, number> = {};
    if (gIds.length > 0) { const { data: mem } = await supabase.from('group_members').select('group_id').in('group_id', gIds); (mem || []).forEach((m: any) => { mc[m.group_id] = (mc[m.group_id] || 0) + 1; }); }
    setSuggestedGroups(gList.map((g: any) => ({ id: g.id, name: g.name || '', memberCount: mc[g.id] || 0, isPrivate: g.is_private || false, coverUrl: g.cover_url || '' })));
  };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!data) return;
      setMyId(data.id);
      const [{ data: follows }, { data: memberships }] = await Promise.all([
        supabase.from('follows').select('followed_id').eq('follower_id', data.id),
        supabase.from('group_members').select('group_id').eq('user_id', data.id),
      ]);
      setFollowingIds(new Set((follows || []).map((f: any) => f.followed_id)));
      setJoinedIds(new Set((memberships || []).map((m: any) => m.group_id)));
      loadSuggestions(data.id);
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
      id: u.id, name: u.name || t('role_user_title'), username: u.username || '',
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
      await supabase.from('follows').delete().eq('follower_id', myId).eq('followed_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: myId, followed_id: userId });
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
            placeholder={t('search_placeholder')}
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

      {/* Tab bar — sempre visibile */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {([
          { key: 'utenti', label: t('search_people'), icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
          { key: 'gruppi', label: t('search_groups'),  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/><circle cx="18" cy="5" r="3"/></svg> },
          { key: 'post',   label: t('search_posts'),    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
        ] as { key: 'utenti'|'gruppi'|'post'; label: string; icon: React.ReactNode }[]).map(tab_item => (
          <button key={tab_item.key} onClick={() => setTab(tab_item.key)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === tab_item.key ? ORANGE : 'transparent'}`, cursor: 'pointer', color: tab === tab_item.key ? ORANGE : '#AAAAAA' }}>
            {tab_item.icon}
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: tab === tab_item.key ? ORANGE : '#AAAAAA' }}>{tab_item.label}</span>
          </button>
        ))}
      </div>

      {/* Contenuto */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
        ) : (
          <>
            {/* ── PERSONE ── */}
            {tab === 'utenti' && (() => {
              const list = query ? users : suggestedUsers;
              return list.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? t('search_no_users') : t('search_no_people')}</span></div>
                : <>{!query && <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#AAAAAA', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>{t('search_suggested_people')}</p>}
                  {list.map(item => {
                    const following = followingIds.has(item.id); const isMe = item.id === myId;
                    return (
                      <div key={item.id} onClick={() => { if (onUserPress) { onClose(); onUserPress(item.id); } }}
                        style={{ display: 'flex', alignItems: 'center', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F6F6F6', cursor: 'pointer' }}>
                        <AvatarImg uri={item.avatarUrl} size={48} seed={item.username} />
                        <div style={{ flex: 1, marginLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#111' }}>{item.name}</span>
                            {item.username === JES_OFFICIAL_USERNAME && <svg width="15" height="15" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#F07B1D"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                          </div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>@{item.username}{item.discipline ? ` · ${item.discipline}` : ''}</span>
                        </div>
                        {!isMe && (
                          <button onClick={e => { e.stopPropagation(); toggleFollow(item.id); }}
                            style={{ border: `1.5px solid ${ORANGE}`, borderRadius: 20, padding: '6px 14px', backgroundColor: following ? ORANGE : 'transparent', cursor: 'pointer' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: following ? '#fff' : ORANGE }}>{following ? t('profile_following_btn') : t('profile_follow')}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}</>;
            })()}

            {/* ── GRUPPI ── */}
            {tab === 'gruppi' && (() => {
              const list = query ? groups : suggestedGroups;
              return list.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? t('search_no_groups') : t('search_no_groups_avail')}</span></div>
                : <>{!query && <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#AAAAAA', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>{t('search_suggested_groups')}</p>}
                  {list.map(item => {
                    const joined = joinedIds.has(item.id);
                    return (
                      <div key={item.id} onClick={() => { if (onGroupPress) { onClose(); onGroupPress(item.id); } }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}>
                        {item.coverUrl ? <img src={item.coverUrl} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} alt="" /> : <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#F5F5F5', flexShrink: 0 }} />}
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111', display: 'block', marginBottom: 4 }}>{item.name}</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA' }}>{item.isPrivate ? t('groups_private') : t('groups_public')} · {item.memberCount.toLocaleString()} {t('groups_members')}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleJoinGroup(item.id); }}
                          style={{ border: `1.5px solid ${ORANGE}`, borderRadius: 16, padding: '6px 12px', backgroundColor: joined ? ORANGE : 'transparent', cursor: 'pointer', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: joined ? '#fff' : ORANGE }}>{joined ? t('groups_joined') : t('groups_join')}</span>
                        </button>
                      </div>
                    );
                  })}</>;
            })()}

            {/* ── POST ── */}
            {tab === 'post' && (() => {
              const list = query ? posts : suggestedPosts;
              return list.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{query ? t('search_no_posts') : t('search_no_posts_avail')}</span></div>
                : <>{!query && <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#AAAAAA', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>{t('search_recent_posts')}</p>}
                  {list.map(item => (
                    <div key={item.id} onClick={() => { if (onPostPress && item.imageUrl) { onClose(); onPostPress(item.id, item.imageUrl); } }}
                      style={{ display: 'flex', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F6F6F6', cursor: onPostPress ? 'pointer' : 'default' }}>
                      {item.imageUrl ? <img src={item.imageUrl} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} alt="" /> : <div style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F5F5F5', flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <AvatarImg uri={item.avatarUrl} size={20} seed={item.username} />
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#888' }}>@{item.username}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#111', lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{item.caption}</span>
                      </div>
                    </div>
                  ))}</>;
            })()}
          </>
        )}
      </div>
    </div>
  );
}
