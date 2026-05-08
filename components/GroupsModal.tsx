'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import GroupDetail, { Group } from './GroupDetailModal';
import { useLang } from '@/lib/i18n';

const ORANGE = '#F07B1D';

type Screen = 'list' | 'detail' | 'create';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPostPublished?: (post: any) => void;
  initialGroupId?: string;
}

const OFFICIAL_GROUPS = [
  'Pittura', 'Scultura', 'Moda e Fashion', 'Antiquariato', 'Letteratura', 'Fotografia', 'Cucina Chef', 'Tattoo',
  'Design', 'Architettura', 'Archeologia', 'Storia', 'Recitazione e Danza',
  'Musica', 'Fumettistica', 'Arte di Strada', 'Partner', 'Sponsor',
];

const OFFICIAL_GROUP_KEYS: Record<string, string> = {
  'Pittura': 'cat_painting', 'Scultura': 'cat_sculpture', 'Moda e Fashion': 'cat_fashion',
  'Fotografia': 'cat_photography', 'Design': 'cat_graphic', 'Musica': 'grp_music',
  'Letteratura': 'grp_literature', 'Cucina Chef': 'grp_cooking', 'Tattoo': 'grp_tattoo',
  'Architettura': 'grp_architecture', 'Archeologia': 'grp_archaeology', 'Storia': 'grp_history',
  'Recitazione e Danza': 'grp_performing', 'Fumettistica': 'grp_comics',
  'Arte di Strada': 'cat_street', 'Partner': 'grp_partner', 'Sponsor': 'cat_sponsor',
  'Antiquariato': 'grp_antiques',
};

// Returns translated description for official groups, or the original description
function getGroupDescription(name: string, description: string, t: (k: string) => string): string {
  if (!OFFICIAL_GROUPS.includes(name)) return description;
  const key = OFFICIAL_GROUP_KEYS[name];
  if (!key) return description;
  return `${t('groups_official_prefix')} ${t(key)}`;
}

export default function GroupsModal({ visible, onClose, onPostPublished, initialGroupId }: Props) {
  const { t } = useLang();
  const [screen, setScreen]         = useState<Screen>('list');
  const [groups, setGroups]         = useState<Group[]>([]);
  const [loading, setLoading]       = useState(false);
  const [myId, setMyId]             = useState<string | null>(null);
  const [joinedIds, setJoinedIds]   = useState<Set<string>>(new Set());
  const [openGroup, setOpenGroup]   = useState<Group | null>(null);
  const [search, setSearch]         = useState('');

  const [newName, setNewName]       = useState('');
  const [newDesc, setNewDesc]       = useState('');

  const filteredGroups = useMemo(() =>
    groups.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
    ), [groups, search]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let dbUserId: string | null = null;
    if (user) {
      const { data: u } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      dbUserId = u?.id ?? null;
      setMyId(dbUserId);
    }
    const { data: grps } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (!grps) { setLoading(false); return; }

    const groupIds = grps.map((g: any) => g.id);
    const { data: members } = await supabase.from('group_members').select('group_id, user_id').in('group_id', groupIds);

    const memberCounts: Record<string, number> = {};
    const joinedSet = new Set<string>();
    (members || []).forEach((m: any) => {
      memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      if (m.user_id === dbUserId) joinedSet.add(m.group_id);
    });
    setJoinedIds(joinedSet);

    let loadedGroups: Group[] = grps.map((g: any) => ({
      id: g.id, name: g.name || '', description: g.description || '',
      members: memberCounts[g.id] || 0, coverUrl: g.cover_url || '', isPrivate: g.is_private || false,
      createdBy: g.created_by || null,
    }));

    loadedGroups.sort((a, b) => {
      const idxA = OFFICIAL_GROUPS.indexOf(a.name);
      const idxB = OFFICIAL_GROUPS.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
    setGroups(loadedGroups);
    setLoading(false);

    if (dbUserId) {
      const missing = OFFICIAL_GROUPS.filter(name => !loadedGroups.some((g: any) => g.name === name));
      if (missing.length > 0) {
        await supabase.from('groups').insert(missing.map(name => ({
          name, description: `Official JES group — ${name}`, is_private: false, created_by: dbUserId,
        })));
      }
    }
  }, []);

  useEffect(() => { if (visible) loadGroups(); }, [visible, loadGroups]);

  useEffect(() => {
    if (!initialGroupId || groups.length === 0) return;
    const target = groups.find(g => g.id === initialGroupId);
    if (target) { setOpenGroup(target); setScreen('detail'); }
  }, [initialGroupId, groups]);

  const goToGroup = (group: Group) => { setOpenGroup(group); setScreen('detail'); };
  const goBack    = () => { setOpenGroup(null); setScreen('list'); };

  const toggleJoin = async (id: string) => {
    if (!myId) return;
    const wasJoined = joinedIds.has(id);
    setJoinedIds(prev => { const next = new Set(prev); wasJoined ? next.delete(id) : next.add(id); return next; });
    setGroups(prev => prev.map(g => g.id !== id ? g : { ...g, members: wasJoined ? g.members - 1 : g.members + 1 }));
    if (wasJoined) {
      await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', myId);
    } else {
      await supabase.from('group_members').insert({ group_id: id, user_id: myId });
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !myId) return;
    const { data: g, error } = await supabase.from('groups').insert({
      name: newName.trim(), description: newDesc.trim() || t('groups_default_desc'),
      is_private: false, created_by: myId,
    }).select('id, name, description, cover_url, is_private').single();
    if (error || !g) return;
    await supabase.from('group_members').insert({ group_id: g.id, user_id: myId });
    const newGroup: Group = { id: g.id, name: g.name, description: g.description || '', members: 1, coverUrl: g.cover_url || '', isPrivate: g.is_private || false };
    setGroups(prev => [newGroup, ...prev]);
    setJoinedIds(prev => new Set([...prev, g.id]));
    setNewName(''); setNewDesc('');
    setScreen('list');
  };

  const handleClose = () => { setScreen('list'); setOpenGroup(null); setSearch(''); onClose(); };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>

      {/* ── LISTA ── */}
      {screen === 'list' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}>
            <button onClick={handleClose} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: '#111' }}>{t('groups_title')}</span>
            <button onClick={() => setScreen('create')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: ORANGE, border: 'none', borderRadius: 20, padding: '9px 14px', cursor: 'pointer' }}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#fff' }}>{t('groups_create')}</span>
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 12, padding: '11px 14px', backgroundColor: '#fff', borderRadius: 16, border: '1px solid #EEEEEE' }}>
            <svg width="18" height="18" fill="none" stroke="#AAA" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: '#111' }}
              placeholder={t('groups_search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search.length > 0 && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <svg width="18" height="18" fill="#CCC" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 40px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
                <svg width="40" height="40" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#CCC' }}>{t('groups_not_found')}</span>
              </div>
            ) : (
              filteredGroups.map(item => {
                const joined   = joinedIds.has(item.id);
                const official = OFFICIAL_GROUPS.includes(item.name);
                return (
                  <div key={item.id}
                    onClick={() => goToGroup(item)}
                    style={{ backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12, cursor: 'pointer', border: official ? `1.5px solid ${ORANGE}55` : 'none' }}>
                    {/* Cover */}
                    <div style={{ position: 'relative' }}>
                      {item.coverUrl
                        ? <img src={item.coverUrl} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} alt={item.name} />
                        : <div style={{ width: '100%', height: 130, backgroundColor: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="40" height="40" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                          </div>
                      }
                      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, backgroundColor: item.isPrivate ? 'rgba(90,90,90,0.88)' : 'rgba(52,199,89,0.92)', padding: '4px 10px', borderRadius: 12 }}>
                        <svg width="11" height="11" fill="white" viewBox="0 0 24 24">
                          {item.isPrivate
                            ? <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                            : <circle cx="12" cy="12" r="10"/>}
                        </svg>
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#fff' }}>{item.isPrivate ? t('groups_private') : t('groups_public')}</span>
                      </div>
                    </div>
                    {/* Body */}
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {official && <svg width="13" height="13" fill={ORANGE} viewBox="0 0 24 24"><path d="M12 2l-3.09 6.26L2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L16.99 14.14 22 9.27l-6.91-1.01L12 2z"/></svg>}
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: '#111' }}>{OFFICIAL_GROUP_KEYS[item.name] ? t(OFFICIAL_GROUP_KEYS[item.name]) : item.name}</span>
                        {official && <svg width="16" height="16" fill={ORANGE} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#777', lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{getGroupDescription(item.name, item.description, t)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                          <svg width="13" height="13" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>{item.members.toLocaleString()} {t('groups_members')}</span>
                          {joined && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: '#34C75914', padding: '2px 7px', borderRadius: 8 }}>
                              <svg width="12" height="12" fill="#34C759" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#34C759' }}>{t('groups_member')}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); toggleJoin(item.id); }}
                          style={{ border: `1.5px solid ${ORANGE}`, borderRadius: 18, padding: '7px 14px', backgroundColor: joined ? ORANGE : 'transparent', cursor: 'pointer' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: joined ? '#fff' : ORANGE }}>{joined ? t('groups_joined') : t('groups_join')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── DETTAGLIO GRUPPO ── */}
      {screen === 'detail' && openGroup && (
        <GroupDetail
          group={openGroup}
          joined={joinedIds.has(openGroup.id)}
          onBack={goBack}
          onToggleJoin={() => toggleJoin(openGroup.id)}
          onPostPublished={onPostPublished}
        />
      )}

      {/* ── CREA GRUPPO ── */}
      {screen === 'create' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #F0F0F0' }}>
            <button onClick={() => setScreen('list')} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: '#111' }}>{t('groups_new')}</span>
            <div style={{ width: 60 }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', marginBottom: 8, marginTop: 20 }}>
              {t('groups_name_label')} <span style={{ color: ORANGE }}>*</span>
            </label>
            <input
              style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: '1.5px solid #E8E8E8', borderRadius: 14, padding: '13px 16px', outline: 'none', backgroundColor: '#fff' }}
              placeholder={t('groups_name_placeholder')}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={50}
              autoFocus
            />
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', marginBottom: 8, marginTop: 20 }}>{t('groups_desc_label')}</label>
            <textarea
              style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: '1.5px solid #E8E8E8', borderRadius: 14, padding: '13px 16px', outline: 'none', backgroundColor: '#fff', minHeight: 90, resize: 'none', lineHeight: '22px' }}
              placeholder={t('groups_desc_placeholder')}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              style={{ backgroundColor: newName.trim() ? ORANGE : '#E0E0E0', border: 'none', borderRadius: 16, padding: '16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#fff', cursor: newName.trim() ? 'pointer' : 'default', marginTop: 28 }}>
              {t('groups_create_btn')}
            </button>
          </div>
        </>
      )}

    </div>
  );
}
