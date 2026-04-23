'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';
import AdminPanelModal from './AdminPanelModal';
import { useLang, LANGUAGES } from '@/lib/i18n';
import { COUNTRIES, countryFlag } from '@/lib/countries';

const ORANGE = '#F07B1D';
const JES_OFFICIAL_USERNAME = 'jes_official';

const LINK_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|it|net|org|io|co|uk|de|fr|es|eu|app|dev|me|info|biz|edu)(?:\/[^\s]*)?)/g;

function parseLinks(text: string): { text: string; isUrl: boolean }[] {
  const result: { text: string; isUrl: boolean }[] = [];
  let lastIndex = 0; let match;
  const re = new RegExp(LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) result.push({ text: text.slice(lastIndex, match.index), isUrl: false });
    result.push({ text: match[0], isUrl: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), isUrl: false });
  return result;
}

function formatNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

const SETTINGS = [
  { id: 's1', icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, label: 'Modifica profilo' },
  { id: 's2', icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, label: 'Notifiche' },
  { id: 's5', icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: 'Assistenza' },
  { id: 's6', icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, label: 'Terms & Privacy' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  targetUserId?: string;
  onMessagePress: (userId: string, name: string, avatar: string | null) => void;
  onRequestViewUser: (userId: string) => void;
  onPostAsJes: (jesUserId: string, type: 'post' | 'story') => void;
}

export default function ProfileModal({ visible, onClose, targetUserId, onMessagePress, onRequestViewUser, onPostAsJes }: Props) {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const isOwnProfile = !targetUserId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab]           = useState<'posts' | 'saved'>('posts');
  const [showSettings, setShowSettings]     = useState(false);
  const [settingsScreen, setSettingsScreen] = useState<null | 'notifiche' | 'lingua'>(null);
  const [followListVisible, setFollowListVisible] = useState<null | 'followers' | 'seguiti'>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost]     = useState<any | null>(null);
  const [selectedPostLoaded, setSelectedPostLoaded] = useState(false);
  const [selectedPostLiked, setSelectedPostLiked] = useState(false);
  const [selectedPostLikes, setSelectedPostLikes] = useState(0);
  const [selectedPostComments, setSelectedPostComments] = useState<any[]>([]);
  const [selectedPostComment, setSelectedPostComment] = useState('');
  const [selectedPostSending, setSelectedPostSending] = useState(false);
  const [savedPosts, setSavedPosts]         = useState<{ id: string; url: string }[]>([]);
  const [savedLoaded, setSavedLoaded]       = useState(false);

  const [profile, setProfile]               = useState<any>(null);
  const [gridPosts, setGridPosts]           = useState<{ id: string; url: string }[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing]       = useState(false);
  const [isFollower, setIsFollower]         = useState(false);
  const [totalLikes, setTotalLikes]         = useState(0);
  const [myDbId, setMyDbId]                 = useState<string | null>(null);
  const [currentDbId, setCurrentDbId]       = useState<string | null>(null);
  const [myRole, setMyRole]                 = useState<string | null>(null);
  const [loading, setLoading]               = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [followersList, setFollowersList]   = useState<any[]>([]);
  const [followingList, setFollowingList]   = useState<any[]>([]);
  const [listsLoaded, setListsLoaded]       = useState(false);

  // Edit profile
  const [editName, setEditName]               = useState('');
  const [editUsername, setEditUsername]       = useState('');
  const [editBio, setEditBio]                 = useState('');
  const [editPhone, setEditPhone]             = useState('');
  const [editNationality, setEditNationality] = useState('');
  const [showNatList, setShowNatList]         = useState(false);
  const [natFilter, setNatFilter]             = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications settings (UI only)
  const [notifLike, setNotifLike]           = useState(true);
  const [notifFollower, setNotifFollower]   = useState(true);
  const [notifMessaggi, setNotifMessaggi]   = useState(true);
  const [notifStorie, setNotifStorie]       = useState(true);
  const [notifMenzioni, setNotifMenzioni]   = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let dbMyId: string | null = myDbId;
      const { data: me, error: meError } = await supabase.from('users').select('id, role').eq('auth_id', user.id).single();
if (me) {
        dbMyId = me.id;
        setMyDbId(me.id);
        setMyRole(me.role ?? null);
      }
      setCurrentDbId(dbMyId);
      const userId = targetUserId ?? dbMyId;
      if (!userId) return;

      const { data } = await supabase.from('users').select('id, name, username, bio, avatar_url, discipline, role, phone, nationality').eq('id', userId).single();
      if (!data) return;
      setProfile(data);
      if (isOwnProfile) { setEditName(data.name || ''); setEditUsername(data.username || ''); setEditBio(data.bio || ''); setEditPhone(data.phone || ''); setEditNationality(data.nationality || ''); }

      const { data: posts } = await supabase.from('posts').select('id, image_url, image_urls').eq('user_id', data.id).order('created_at', { ascending: false }).limit(30);
      if (posts) {
        setGridPosts(posts.map((p: any) => ({ id: p.id, url: (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || '' })).filter((p: any) => p.url));
      }

      const [{ count: frs }, { count: fng }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('followed_id', data.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.id),
      ]);
      setFollowersCount(frs ?? 0);
      setFollowingCount(fng ?? 0);

      const postIds = posts?.map((p: any) => p.id) ?? [];
      if (postIds.length > 0) {
        const { count: likesTotal } = await supabase.from('likes').select('*', { count: 'exact', head: true }).in('post_id', postIds);
        setTotalLikes(likesTotal ?? 0);
      } else {
        setTotalLikes(0);
      }

      if (!isOwnProfile && dbMyId) {
        const { data: fr } = await supabase.from('follows').select('id').eq('follower_id', dbMyId).eq('followed_id', data.id).maybeSingle();
        setIsFollowing(!!fr);
        const { data: followerRow } = await supabase.from('follows').select('id').eq('follower_id', data.id).eq('followed_id', dbMyId).maybeSingle();
        setIsFollower(!!followerRow);
      }
    } finally { setLoading(false); }
  }, [targetUserId, isOwnProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (visible) { setListsLoaded(false); setSavedLoaded(false); setSavedPosts([]); setActiveTab('posts'); setFollowListVisible(null); loadProfile(); } }, [visible, targetUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFollowersFollowing = useCallback(async () => {
    if (listsLoaded || !profile) return;
    setListsLoaded(true);
    const [{ data: frRows }, { data: fngRows }] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('followed_id', profile.id).limit(100),
      supabase.from('follows').select('followed_id').eq('follower_id', profile.id).limit(100),
    ]);
    const frIds = (frRows || []).map((r: any) => r.follower_id);
    const fngIds = (fngRows || []).map((r: any) => r.followed_id);
    const [{ data: frUsers }, { data: fngUsers }] = await Promise.all([
      frIds.length > 0 ? supabase.from('users').select('id, name, username, avatar_url').in('id', frIds) : Promise.resolve({ data: [] }),
      fngIds.length > 0 ? supabase.from('users').select('id, name, username, avatar_url').in('id', fngIds) : Promise.resolve({ data: [] }),
    ]);
    setFollowersList(frUsers || []);
    setFollowingList(fngUsers || []);
  }, [listsLoaded, profile]);

  const openPost = useCallback(async (postId: string, previewUrl?: string) => {
    setSelectedPostId(postId);
    setSelectedPostLoaded(false);
    setSelectedPostComments([]);
    setSelectedPostComment('');
    setSelectedPostLiked(false);
    setSelectedPostLikes(0);
    if (previewUrl) setSelectedPost({ id: postId, image_url: previewUrl, image_urls: [previewUrl], caption: null, users: profile });
    const postRes = await supabase.from('posts').select('id, caption, image_url, image_urls, created_at, user_id, users(name, username, avatar_url)').eq('id', postId).single();
    const commentsRes = await supabase.from('comments').select('id, text, created_at, user_id, users(name, username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true }).limit(30);
    const likesRes = await supabase.from('likes').select('user_id').eq('post_id', postId);
    console.log('[openPost] likes:', likesRes.data, 'error:', likesRes.error, 'postId:', postId);
    const likes = likesRes.data || [];
    const uid = myDbId || currentDbId;
    setSelectedPostLikes(likes.length);
    setSelectedPostLiked(uid ? likes.some((l: any) => l.user_id === uid) : false);
    if (postRes.data) setSelectedPost(postRes.data);
    if (commentsRes.data) setSelectedPostComments(commentsRes.data);
    setSelectedPostLoaded(true);
  }, [myDbId, currentDbId, profile]);

  const loadSaved = useCallback(async () => {
    if (savedLoaded || !currentDbId) return;
    setSavedLoaded(true);
    const { data: rows } = await supabase.from('saves').select('post_id').eq('user_id', currentDbId).order('created_at', { ascending: false }).limit(30);
    if (!rows || rows.length === 0) return;
    const postIds = rows.map((r: any) => r.post_id);
    const { data: posts } = await supabase.from('posts').select('id, image_url, image_urls').in('id', postIds);
    if (posts) {
      setSavedPosts(posts.map((p: any) => ({ id: p.id, url: (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || '' })).filter((p: any) => p.url));
    }
  }, [savedLoaded, currentDbId]);

  useEffect(() => {
    if (activeTab === 'saved') loadSaved();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFollow = async () => {
    if (!myDbId || !profile) return;
    if (isFollowing) {
      setIsFollowing(false); setFollowersCount(c => Math.max(0, c - 1));
      const { error } = await supabase.from('follows').delete().eq('follower_id', myDbId).eq('followed_id', profile.id);
      if (error) { setIsFollowing(true); setFollowersCount(c => c + 1); }
    } else {
      setIsFollowing(true); setFollowersCount(c => c + 1);
      await supabase.from('follows').insert({ follower_id: myDbId, followed_id: profile.id });
      await supabase.from('notifications').insert({ user_id: profile.id, sender_id: myDbId, type: 'follow' });
    }
  };

  const handlePickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    (async () => {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filePath = `avatars/${profile.id}_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('media').upload(filePath, file, { contentType: file.type, upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('media').getPublicUrl(filePath);
        const avatarUrl = data.publicUrl + `?t=${Date.now()}`;
        await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', profile.id);
        await loadProfile();
      } catch (e) { alert(t('profile_cover_error')); }
      finally { setUploadingAvatar(false); }
    })();
  };

  const saveProfile = async () => {
    if (!profile || savingProfile) return;
    setSavingProfile(true);
    const { error } = await supabase.from('users').update({ name: editName.trim(), username: editUsername.trim().replace('@', ''), bio: editBio.trim(), phone: editPhone.trim() || null, nationality: editNationality || null }).eq('id', profile.id);
    setSavingProfile(false);
    if (error) { alert(error.message); return; }
    await loadProfile();
    setShowEditProfile(false);
  };

  const handleSignOut = async () => {
    if (!confirm(t('profile_logout_confirm'))) return;
    await supabase.auth.signOut();
    onClose();
    setTimeout(() => router.replace('/'), 300);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile_delete_confirm'))) return;
    if (!profile?.id) return;
    await supabase.from('users').delete().eq('id', profile.id);
    await supabase.auth.signOut();
    onClose();
    setTimeout(() => router.replace('/'), 300);
  };

  if (!visible) return null;

  const isJes = profile?.username === JES_OFFICIAL_USERNAME;
  const displayFollowers = isJes ? Math.max(followersCount, 1300) : followersCount;

  // ── Edit Profile Screen ───────────────────────────────────────────────────────
  if (showEditProfile) {
    return (
      <div className="pm-panel" style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => setShowEditProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, color: '#888' }}>{t('cancel')}</button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#111' }}>{t('edit_profile')}</span>
          <button onClick={saveProfile} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: ORANGE }}>
            {savingProfile ? <div className="spin" style={{ width: 18, height: 18 }} /> : t('save')}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <AvatarImg uri={profile?.avatar_url} size={90} seed={profile?.username} style={{ border: `3px solid ${ORANGE}` }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: '50%', background: ORANGE, border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {uploadingAvatar ? <div className="spin" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5zM20 4h-3.17L15 2H9L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/></svg>}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickAvatar} />
            </div>
          </div>
          {[
            { label: t('profile_edit_name'), value: editName, setter: setEditName, placeholder: t('profile_edit_name_ph') },
            { label: t('profile_edit_username'), value: editUsername, setter: setEditUsername, placeholder: '@username' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: 'none', borderBottom: '1.5px solid #EEE', paddingBottom: 10, paddingTop: 10, outline: 'none', background: 'transparent', boxSizing: 'border-box' } as any} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>{t('bio_edit_label')}</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder={t('bio_edit_placeholder')} rows={3} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: 'none', borderBottom: '1.5px solid #EEE', outline: 'none', background: 'transparent', resize: 'none', boxSizing: 'border-box', paddingTop: 10, paddingBottom: 10 } as any} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              {t('phone_edit_label')} <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: '#AAA', textTransform: 'none', letterSpacing: 0 }}>({t('optional_label')})</span>
            </label>
            <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder={t('phone_placeholder')} maxLength={20} style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: 'none', borderBottom: '1.5px solid #EEE', paddingBottom: 10, paddingTop: 10, outline: 'none', background: 'transparent', boxSizing: 'border-box' } as any} />
          </div>

          {/* Nationality picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              {t('nationality_label')}
              {!editNationality && <span style={{ marginLeft: 6, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: ORANGE, textTransform: 'none', letterSpacing: 0 }}>*</span>}
            </label>
            <button type="button" onClick={() => { setShowNatList(p => !p); setNatFilter(''); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottom: `1.5px solid ${editNationality ? ORANGE : '#EEE'}`, paddingBottom: 10, paddingTop: 10, cursor: 'pointer' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: editNationality ? '#111' : '#AAAAAA', display: 'flex', alignItems: 'center', gap: 8 }}>
                {editNationality ? <><span style={{ fontSize: 22 }}>{countryFlag(editNationality)}</span> {editNationality}</> : t('nationality_placeholder')}
              </span>
              <svg width="16" height="16" fill="none" stroke="#AAAAAA" strokeWidth="2" viewBox="0 0 24 24">
                {showNatList ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
              </svg>
            </button>
            {showNatList && (
              <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #F0F0F0', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', overflow: 'hidden', maxHeight: 240, marginTop: 6 }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #F5F5F5' }}>
                  <input
                    autoFocus
                    placeholder={t('nationality_search')}
                    value={natFilter}
                    onChange={e => setNatFilter(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', border: 'none', outline: 'none', background: 'transparent' }}
                  />
                </div>
                <div style={{ overflowY: 'auto', maxHeight: 190 }}>
                  {COUNTRIES.filter(c => c.name.toLowerCase().includes(natFilter.toLowerCase()) || c.native.toLowerCase().includes(natFilter.toLowerCase())).map(c => (
                    <div key={c.name} onClick={() => { setEditNationality(c.name); setShowNatList(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', backgroundColor: editNationality === c.name ? '#FFF5EE' : 'transparent', borderBottom: '1px solid #F8F8F8' }}>
                      <span style={{ fontSize: 22 }}>{c.flag}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: editNationality === c.name ? ORANGE : '#111', fontWeight: editNationality === c.name ? 700 : 400 }}>
                        {c.name}{c.native !== c.name ? <span style={{ color: '#AAAAAA', fontWeight: 400 }}> — {c.native}</span> : null}
                      </span>
                      {editNationality === c.name && <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="16" height="16" fill="none" stroke={ORANGE} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Settings Screen ───────────────────────────────────────────────────────────
  if (showSettings) {
    return (
      <div className="pm-panel" style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0' }}>
          <button onClick={() => { if (settingsScreen) { setSettingsScreen(null); } else { setShowSettings(false); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#111' }}>
            {settingsScreen === 'notifiche' ? t('notifications') : settingsScreen === 'lingua' ? t('language') : t('settings')}
          </span>
          <div style={{ width: 26 }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
          {settingsScreen === 'lingua' ? (
            <>
              {LANGUAGES.map(l => (
                <div key={l.code} onClick={() => setLang(l.code)} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', background: lang === l.code ? '#FFF8F2' : '#fff' }}>
                  <span style={{ fontSize: 28, marginRight: 14 }}>{l.flag}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: lang === l.code ? ORANGE : '#111' }}>{l.name}</span>
                  {lang === l.code && (
                    <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L19 7"/></svg>
                  )}
                </div>
              ))}
            </>
          ) : settingsScreen === 'notifiche' ? (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#AAA', letterSpacing: '0.8px', padding: '20px 20px 6px', textTransform: 'uppercase' }}>{t('push_notif_label')}</p>
              {[
                { label: t('setting_notif_likes'), value: notifLike, setter: setNotifLike },
                { label: t('setting_notif_followers'), value: notifFollower, setter: setNotifFollower },
                { label: t('setting_notif_messages'), value: notifMessaggi, setter: setNotifMessaggi },
                { label: t('setting_notif_stories'), value: notifStorie, setter: setNotifStorie },
                { label: t('setting_notif_mentions'), value: notifMenzioni, setter: setNotifMenzioni },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F8F8F8' }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#111' }}>{row.label}</span>
                  <div onClick={() => row.setter(v => !v)} style={{ width: 50, height: 28, borderRadius: 14, background: row.value ? ORANGE : '#E0E0E0', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: row.value ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {SETTINGS.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}
                  onClick={() => {
                    if (item.id === 's1') { setShowSettings(false); setTimeout(() => setShowEditProfile(true), 200); }
                    else if (item.id === 's2') { setSettingsScreen('notifiche'); }
                    else if (item.id === 's5') { window.location.href = 'mailto:jes.socialdelleemozioni@gmail.com'; }
                    else if (item.id === 's6') { window.open('https://jessocial.com/legal/termini', '_system'); }
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>{item.icon}</div>
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#111' }}>
                    {item.id === 's1' ? t('edit_profile') : item.id === 's2' ? t('notifications') : item.id === 's5' ? t('support') : item.label}
                  </span>
                  <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
              {/* Language row */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }} onClick={() => setSettingsScreen('lingua')}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </div>
                <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#111' }}>{t('language')}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAA', marginRight: 6 }}>
                  {LANGUAGES.find(l => l.code === lang)?.flag}
                </span>
                <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {myRole === 'admin' && (
                <>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#AAA', letterSpacing: '0.8px', padding: '20px 20px 6px', textTransform: 'uppercase' }}>{t('admin_panel')}</p>
                  {[
                    { icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: t('admin_panel'), action: () => { window.open('/admin', '_blank'); } },
                    { icon: <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7 12.5l3.5 3.5 6.5-7"/></svg>, label: t('official_profile'), action: async () => {
                      const { data } = await supabase.from('users').select('id').eq('username', JES_OFFICIAL_USERNAME).maybeSingle();
                      if (data) { setShowSettings(false); onRequestViewUser(data.id); } else alert(`Crea prima l'utente "${JES_OFFICIAL_USERNAME}" in Supabase.`);
                    }},
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }} onClick={item.action}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>{item.icon}</div>
                      <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#111' }}>{item.label}</span>
                      <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </>
              )}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }} onClick={handleSignOut}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </div>
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#FF3B30' }}>{t('logout')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }} onClick={handleDeleteAccount}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </div>
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15, color: '#FF3B30' }}>{t('delete_account')}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <AdminPanelModal visible={showAdminPanel} onClose={() => setShowAdminPanel(false)} onUserPress={(userId) => { setShowAdminPanel(false); onRequestViewUser(userId); }} />
      </div>
    );
  }

  // ── Main Profile Screen ───────────────────────────────────────────────────────
  return (
    <div className="pm-panel" style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#111' }}>
          {isOwnProfile ? t('profile_title') : profile?.username ? `@${profile.username}` : t('profile_title')}
        </span>
        {isOwnProfile ? (
          <button onClick={() => { setSettingsScreen(null); setShowSettings(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
        ) : profile?.username !== JES_OFFICIAL_USERNAME ? (
          <button onClick={toggleFollow} style={{ borderWidth: 1.5, borderStyle: 'solid', borderColor: isFollowing ? '#E0E0E0' : ORANGE, borderRadius: 20, padding: '6px 16px', background: isFollowing ? ORANGE : 'transparent', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: isFollowing ? '#fff' : ORANGE }}>{isFollowing ? t('profile_following_btn') : t('profile_follow')}</span>
          </button>
        ) : <div style={{ width: 26 }} />}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spin" /></div>
      ) : !profile ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#AAA', fontFamily: 'var(--font-body)' }}>{t('profile_not_found')}</p>
      ) : (
        <>
          {/* Avatar + stats */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '24px 20px 16px', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              {isJes ? (
                <div onClick={() => myRole === 'admin' && fileInputRef.current?.click()} style={{ cursor: myRole === 'admin' ? 'pointer' : 'default', position: 'relative' }}>
                  <AvatarImg uri={profile.avatar_url || '/icon.png'} size={88} seed={profile.username} style={{ border: `3px solid ${ORANGE}` }} />
                  {myRole === 'admin' && <div style={{ position: 'absolute', bottom: 2, right: 2, background: ORANGE, borderRadius: 12, padding: 5, display: 'flex' }}><svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5zM20 4h-3.17L15 2H9L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/></svg></div>}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickAvatar} />
                </div>
              ) : (
                <AvatarImg uri={profile.avatar_url} size={88} seed={profile.username} style={{ border: `3px solid ${ORANGE}` }} />
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              {[
                { num: gridPosts.length, label: t('profile_posts'), onClick: undefined },
                { num: formatNum(displayFollowers), label: t('profile_followers'), onClick: () => { setFollowListVisible('followers'); loadFollowersFollowing(); } },
                { num: followingCount, label: t('profile_following'), onClick: () => { setFollowListVisible('seguiti'); loadFollowersFollowing(); } },
              ].map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {i > 0 && <div style={{ width: 1, height: 32, background: '#EEE', marginRight: 0 }} />}
                  <div onClick={s.onClick} style={{ textAlign: 'center', paddingLeft: i > 0 ? 10 : 0, cursor: s.onClick ? 'pointer' : 'default' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#111' }}>{s.num}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: s.onClick ? ORANGE : '#888', marginTop: 1 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Like totali badge */}
          {totalLikes > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '-8px 20px 12px', background: '#FFF0E6', borderRadius: 20, padding: '7px 14px', alignSelf: 'flex-start', width: 'fit-content' }}>
              <svg width="18" height="18" fill="#F07B1D" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: ORANGE }}>{formatNum(totalLikes)}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>{t('likes_total')}</span>
            </div>
          )}

          {/* Banner mutual follow */}
          {!isOwnProfile && isFollower && isFollowing && (
            <div style={{ margin: '0 20px 12px', background: ORANGE, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#fff' }}>{t('mutual_follow')}</span>
            </div>
          )}

          {/* Name + bio */}
          <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>{profile.name || t('user_fallback')}</span>
              {profile.username === JES_OFFICIAL_USERNAME && (
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="12" fill="#F07B1D"/>
                  <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888', marginTop: 1 }}>@{profile.username || ''}</p>
            {profile.bio ? (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#444', lineHeight: '19px', marginTop: 8 }}>
                {parseLinks(profile.bio).map((part, i) =>
                  part.isUrl ? <a key={i} href={part.text.startsWith('http') ? part.text : `https://${part.text}`} target="_blank" rel="noreferrer" style={{ color: ORANGE, textDecoration: 'underline' }}>{part.text}</a> : <span key={i}>{part.text}</span>
                )}
              </p>
            ) : null}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {profile.discipline && (
                <span style={{ background: '#FFF0E6', borderRadius: 20, padding: '5px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: ORANGE }}>{profile.discipline}</span>
              )}
              {profile.nationality && (
                <span style={{ background: '#F5F5F5', borderRadius: 20, padding: '5px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#444', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 16 }}>{countryFlag(profile.nationality)}</span>
                  {profile.nationality}
                </span>
              )}
            </div>
            {isOwnProfile && !profile.nationality && (
              <div onClick={() => setShowEditProfile(true)} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#FFF5EE', borderRadius: 12, padding: '9px 14px', cursor: 'pointer', border: `1px dashed ${ORANGE}` }}>
                <span style={{ fontSize: 20 }}>🌍</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: ORANGE, fontWeight: 600 }}>{t('nationality_add_prompt')}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isOwnProfile && (
            <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
              <button onClick={() => setShowEditProfile(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, border: '1.5px solid #E0E0E0', padding: '10px 0', background: 'none', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#111' }}>Modifica profilo</span>
              </button>
              <button onClick={async () => {
                const shareUrl = `${window.location.origin}/profile/${profile.username}`;
                const shareData = { title: `Profilo di @${profile.username} su JES`, url: shareUrl };
                if (navigator.share) {
                  try { await navigator.share(shareData); } catch {}
                } else {
                  await navigator.clipboard.writeText(shareUrl);
                  alert(t('profile_link_copied_short'));
                }
              }} style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1.5px solid #E0E0E0', background: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
            </div>
          )}
          {!isOwnProfile && profile.username !== JES_OFFICIAL_USERNAME && (
            <div style={{ padding: '0 20px 16px' }}>
              <button onClick={() => { onMessagePress(profile.id, profile.name || profile.username, profile.avatar_url); onClose(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, border: '1.5px solid #E0E0E0', padding: '10px 0', background: 'none', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#111' }}>{t('write_message')}</span>
              </button>
            </div>
          )}
          {!isOwnProfile && isJes && myRole === 'admin' && (
            <div style={{ padding: '0 20px 16px' }}>
              <button onClick={() => {
                const type = confirm(t('publish_as_jes')) ? 'post' : 'story';
                onPostAsJes(profile.id, type);
              }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, border: `1.5px solid ${ORANGE}`, padding: '10px 0', background: 'none', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke={ORANGE} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: ORANGE }}>{t('publish_as_jes')}</span>
              </button>
            </div>
          )}

          {/* Tab bar — Post + Salvati (solo profilo proprio) */}
          <div style={{ display: 'flex', borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0' }}>
            <button onClick={() => setActiveTab('posts')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'posts' ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
              <svg width="22" height="22" fill="none" stroke={activeTab === 'posts' ? ORANGE : '#AAA'} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
            {isOwnProfile && (
              <button onClick={() => setActiveTab('saved')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === 'saved' ? `2px solid ${ORANGE}` : '2px solid transparent' }}>
                <svg width="22" height="22" fill="none" stroke={activeTab === 'saved' ? ORANGE : '#AAA'} strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              </button>
            )}
          </div>

          {/* Contenuto tabs */}
          {activeTab === 'posts' && (
            gridPosts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
                <svg width="48" height="48" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAA' }}>{t('profile_no_posts')}</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                {gridPosts.map(post => (
                  <img key={post.id} src={post.url} alt="" loading="lazy" onClick={() => openPost(post.id, post.url)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
                ))}
              </div>
            )
          )}
          {activeTab === 'saved' && (
            !savedLoaded ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><div className="spin" /></div>
            ) : savedPosts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 }}>
                <svg width="48" height="48" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAA' }}>{t('profile_no_saved')}</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                {savedPosts.map(post => (
                  <img key={post.id} src={post.url} alt="" loading="lazy" onClick={() => openPost(post.id, post.url)} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
                ))}
              </div>
            )
          )}

          {/* Followers / Seguiti overlay */}
          {followListVisible && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 210, display: 'flex', alignItems: 'flex-end' }} onClick={() => setFollowListVisible(null)}>
              <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '70dvh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F0F0' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#111' }}>
                    {followListVisible === 'followers' ? t('profile_followers') : t('profile_following')}
                  </span>
                  <button onClick={() => setFollowListVisible(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {!listsLoaded ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spin" /></div>
                  ) : (() => {
                    const list = followListVisible === 'followers' ? followersList : followingList;
                    const empty = followListVisible === 'followers' ? t('profile_no_followers') : t('profile_no_following');
                    if (list.length === 0) return <p style={{ textAlign: 'center', padding: 40, color: '#AAA', fontFamily: 'var(--font-body)', fontSize: 14 }}>{empty}</p>;
                    return list.map((u: any) => (
                      <div key={u.id} onClick={() => { setFollowListVisible(null); onRequestViewUser(u.id); }} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                        <AvatarImg uri={u.avatar_url} size={44} seed={u.username} style={{ borderRadius: '50%', border: `2px solid ${ORANGE}`, flexShrink: 0 }} />
                        <div style={{ marginLeft: 12 }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#111' }}>{u.name || u.username}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA', marginTop: 1 }}>@{u.username}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 40 }} />
        </>
      )}

      {/* Post detail overlay */}
      {selectedPostId && selectedPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#F5F5F5', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #EEE', display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12, zIndex: 10 }}>
            <button onClick={() => setSelectedPostId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16 }}>Post</span>
          </div>

          {/* PostCard-style layout */}
          <div className="pc-post">
            {/* Header */}
            <div className="pc-header">
              <div className="pc-avatar-ring">
                <AvatarImg uri={(selectedPost.users as any)?.avatar_url} size={40} seed={(selectedPost.users as any)?.username} className="pc-avatar-img" style={{ borderRadius: '50%' }} />
              </div>
              <div className="pc-meta">
                <div className="pc-username">{(selectedPost.users as any)?.username || t('user_fallback')}</div>
                <div className="pc-discipline">{(selectedPost.users as any)?.discipline || ''}</div>
              </div>
            </div>

            {/* Image */}
            {(() => {
              const urls = Array.isArray(selectedPost.image_urls) && selectedPost.image_urls.length > 0
                ? selectedPost.image_urls : selectedPost.image_url ? [selectedPost.image_url] : [];
              return urls.length > 0 ? (
                <div className="pc-image-wrap">
                  <img src={urls[0]} alt="post" className="pc-single-img" />
                </div>
              ) : null;
            })()}

            {/* Actions */}
            <div className="pc-actions">
              <div className="pc-actions-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className={`pc-action-btn${selectedPostLiked ? ' liked' : ''}`} onClick={async () => {
                    const uid = myDbId || currentDbId;
                    if (!uid || !selectedPostId) return;
                    if (selectedPostLiked) {
                      setSelectedPostLiked(false); setSelectedPostLikes(n => n - 1);
                      await supabase.from('likes').delete().eq('post_id', selectedPostId).eq('user_id', uid);
                    } else {
                      setSelectedPostLiked(true); setSelectedPostLikes(n => n + 1);
                      await supabase.from('likes').insert({ post_id: selectedPostId, user_id: uid });
                    }
                  }}>
                    {selectedPostLiked
                      ? <svg width="28" height="28" fill={ORANGE} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      : <svg width="28" height="28" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    }
                  </button>
                  {!selectedPostLoaded
                    ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#CCC' }}>…</span>
                    : selectedPostLikes > 0 && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#111' }}>{selectedPostLikes.toLocaleString('it-IT')}</span>
                  }
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="pc-action-btn">
                    <svg width="26" height="26" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </button>
                  {!selectedPostLoaded
                    ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#CCC' }}>…</span>
                    : selectedPostComments.length > 0 && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#111' }}>{selectedPostComments.length}</span>
                  }
                </div>
                <button className="pc-action-btn" onClick={async () => {
                  const shareUrl = `${window.location.origin}/post?id=${selectedPostId}`;
                  if (navigator.share) { try { await navigator.share({ title: `Post su JES`, url: shareUrl }); return; } catch {} }
                  try { await navigator.clipboard.writeText(shareUrl); } catch {}
                  alert(t('profile_link_copied_short'));
                }}>
                  <svg width="26" height="26" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>

            {/* Text */}
            <div className="pc-text">
              {selectedPost.caption && (
                <div className="pc-caption-wrap">
                  <span className="pc-caption">
                    <strong className="pc-caption-user">{(selectedPost.users as any)?.username} </strong>
                    {selectedPost.caption}
                  </span>
                </div>
              )}

              {/* Comments */}
              {selectedPostComments.map((c: any) => (
                <p key={c.id} className="pc-comment-line">
                  <strong>{(c.users as any)?.username || t('user_fallback')} </strong>{c.text}
                </p>
              ))}
            </div>

            {/* Comment input */}
            {currentDbId && (
              <div className="pc-quick-comment" style={{ cursor: 'default' }}>
                <div className="pc-quick-avatar">
                  <AvatarImg uri={profile?.avatar_url} size={28} seed={profile?.username || 'tu'} style={{ borderRadius: '50%' }} />
                </div>
                <input
                  value={selectedPostComment}
                  onChange={e => setSelectedPostComment(e.target.value)}
                  placeholder="Aggiungi un commento…"
                  className="pc-quick-input"
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'text' }}
                  onKeyDown={async e => {
                    if (e.key === 'Enter' && selectedPostComment.trim() && !selectedPostSending) {
                      setSelectedPostSending(true);
                      const text = selectedPostComment.trim();
                      setSelectedPostComment('');
                      const { data: nc } = await supabase.from('comments').insert({ post_id: selectedPostId, user_id: currentDbId, text }).select('id, text, created_at, user_id, users(name, username, avatar_url)').single();
                      if (nc) setSelectedPostComments(prev => [...prev, nc]);
                      setSelectedPostSending(false);
                    }
                  }}
                />
                {selectedPostComment.trim() && (
                  <button onClick={async () => {
                    if (!selectedPostComment.trim() || selectedPostSending) return;
                    setSelectedPostSending(true);
                    const text = selectedPostComment.trim();
                    setSelectedPostComment('');
                    const { data: nc } = await supabase.from('comments').insert({ post_id: selectedPostId, user_id: currentDbId, text }).select('id, text, created_at, user_id, users(name, username, avatar_url)').single();
                    if (nc) setSelectedPostComments(prev => [...prev, nc]);
                    setSelectedPostSending(false);
                  }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: ORANGE, padding: '0 4px' }}>
                    {t('publish')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
