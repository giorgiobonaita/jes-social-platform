import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, ScrollView,
  TouchableOpacity, StyleSheet, Image,
  SafeAreaView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase, JES_OFFICIAL_USERNAME } from '../lib/supabase';
import { sendPushNotification } from '../lib/notifications';
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
  const [query, setQuery]       = useState('');
  const [tab, setTab]           = useState<'utenti' | 'post' | 'gruppi'>('utenti');

  const [users, setUsers]       = useState<SearchUser[]>([]);
  const [posts, setPosts]       = useState<SearchPost[]>([]);
  const [groups, setGroups]     = useState<SearchGroup[]>([]);
  const [loading, setLoading]   = useState(false);
  const [myId, setMyId]         = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [joinedIds, setJoinedIds]       = useState<Set<string>>(new Set());
  // Suggerimenti (query vuota)
  const [suggestedUsers,  setSuggestedUsers]  = useState<SearchUser[]>([]);
  const [suggestedPosts,  setSuggestedPosts]  = useState<SearchPost[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<SearchGroup[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carica utente corrente + suggerimenti iniziali
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!data) return;
      setMyId(data.id);
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', data.id);
      setFollowingIds(new Set((follows || []).map((f: any) => f.following_id)));
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', data.id);
      setJoinedIds(new Set((memberships || []).map((m: any) => m.group_id)));
      // Carica suggerimenti (escludi me stesso)
      loadSuggestions(data.id);
    })();
  }, [visible]);

  const loadSuggestions = async (uid: string) => {
    const [{ data: uData }, { data: pData }, { data: gData }] = await Promise.all([
      supabase.from('users').select('id, name, username, avatar_url, discipline')
        .neq('id', uid).limit(12),
      supabase.from('posts').select('id, caption, image_url, user_id')
        .not('image_url', 'is', null).order('created_at', { ascending: false }).limit(12),
      supabase.from('groups').select('id, name, cover_url, is_private').limit(12),
    ]);

    setSuggestedUsers((uData || []).map((u: any) => ({
      id: u.id, name: u.name || 'Utente', username: u.username || '',
      avatarUrl: u.avatar_url || null, discipline: u.discipline || '',
    })));

    const postList = pData || [];
    const authorIds = [...new Set(postList.map((p: any) => p.user_id).filter(Boolean))];
    let authorMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds);
      (authors || []).forEach((a: any) => { authorMap[a.id] = a; });
    }
    setSuggestedPosts(postList.map((p: any) => ({
      id: p.id, caption: p.caption || '', imageUrl: p.image_url || '',
      userId: p.user_id,
      username: authorMap[p.user_id]?.username || 'utente',
      avatarUrl: authorMap[p.user_id]?.avatar_url || null,
    })));

    const groupList = gData || [];
    const groupIds = groupList.map((g: any) => g.id);
    let memberCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: members } = await supabase.from('group_members').select('group_id').in('group_id', groupIds);
      (members || []).forEach((m: any) => { memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1; });
    }
    setSuggestedGroups(groupList.map((g: any) => ({
      id: g.id, name: g.name || '',
      memberCount: memberCounts[g.id] || 0,
      isPrivate: g.is_private || false,
      coverUrl: g.cover_url || null,
    })));
  };

  // Ricerca con debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setUsers([]); setPosts([]); setGroups([]); setLoading(false); return; }
    setLoading(true);
    const pattern = `%${q}%`;
    const [{ data: uData }, { data: pData }, { data: gData }] = await Promise.all([
      supabase.from('users').select('id, name, username, avatar_url, discipline')
        .or(`username.ilike.${pattern},name.ilike.${pattern}`).limit(20),
      supabase.from('posts').select('id, caption, image_url, user_id')
        .ilike('caption', pattern).limit(20),
      supabase.from('groups').select('id, name, cover_url, is_private').ilike('name', pattern).limit(20),
    ]);

    setUsers((uData || []).map((u: any) => ({
      id: u.id, name: u.name || 'Utente', username: u.username || '',
      avatarUrl: u.avatar_url || null, discipline: u.discipline || '',
    })));

    // Per i post, carica info autori
    const postList = pData || [];
    const authorIds = [...new Set(postList.map((p: any) => p.user_id).filter(Boolean))];
    let authorMap: Record<string, any> = {};
    if (authorIds.length > 0) {
      const { data: authors } = await supabase.from('users').select('id, username, avatar_url').in('id', authorIds);
      (authors || []).forEach((a: any) => { authorMap[a.id] = a; });
    }
    setPosts(postList.map((p: any) => ({
      id: p.id, caption: p.caption || '', imageUrl: p.image_url || '',
      userId: p.user_id,
      username: authorMap[p.user_id]?.username || 'utente',
      avatarUrl: authorMap[p.user_id]?.avatar_url || null,
    })));

    // Conta membri gruppi
    const groupList = gData || [];
    const groupIds = groupList.map((g: any) => g.id);
    let memberCounts: Record<string, number> = {};
    if (groupIds.length > 0) {
      const { data: members } = await supabase.from('group_members').select('group_id').in('group_id', groupIds);
      (members || []).forEach((m: any) => { memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1; });
    }
    setGroups(groupList.map((g: any) => ({
      id: g.id, name: g.name || '',
      memberCount: memberCounts[g.id] || 0,
      isPrivate: g.is_private || false,
      coverUrl: g.cover_url || null,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isFollowing = followingIds.has(userId);
    setFollowingIds(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId);
    } else {
      await supabase.from('follows').insert({ follower_id: myId, following_id: userId });
      await supabase.from('notifications').insert({ user_id: userId, sender_id: myId, type: 'follow' });
      sendPushNotification(userId, '👤 Nuovo follower', 'Qualcuno ha iniziato a seguirti', { type: 'follow' }).catch(() => {});
    }
  };

  const toggleJoinGroup = async (groupId: string) => {
    if (!myId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isJoined = joinedIds.has(groupId);
    setJoinedIds(prev => {
      const next = new Set(prev);
      isJoined ? next.delete(groupId) : next.add(groupId);
      return next;
    });
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', myId);
    } else {
      await supabase.from('group_members').insert({ group_id: groupId, user_id: myId });
    }
  };

  const renderUser = ({ item }: { item: SearchUser }) => {
    const following = followingIds.has(item.id);
    const isMe = item.id === myId;
    return (
      <TouchableOpacity style={styles.resultRow} activeOpacity={0.7} onPress={() => { if (onUserPress) { onClose(); onUserPress(item.id); } }}>
        <AvatarImg uri={item.avatarUrl} size={48} style={styles.resultAvatar} />
        <View style={styles.resultMeta}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.resultName}>{item.name}</Text>
            {item.username === JES_OFFICIAL_USERNAME && (
              <Ionicons name="checkmark-circle" size={14} color={ORANGE} />
            )}
          </View>
          <Text style={styles.resultSub}>@{item.username}{item.discipline ? ` · ${item.discipline}` : ''}</Text>
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followBtnActive]}
            onPress={() => toggleFollow(item.id)}
          >
            <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
              {following ? '✓ Seguito' : 'Segui'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: SearchPost }) => (
    <TouchableOpacity style={styles.postResult} activeOpacity={0.7} onPress={() => { if (onPostPress && item.imageUrl) { onClose(); onPostPress(item.id, item.imageUrl); } }}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postThumb} />
      ) : (
        <View style={[styles.postThumb, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="image-outline" size={28} color="#CCC" />
        </View>
      )}
      <View style={styles.postResultMeta}>
        <View style={styles.postResultAuthor}>
          <AvatarImg uri={item.avatarUrl} size={32} style={styles.postResultAvatar} />
          <Text style={styles.postResultUsername}>@{item.username}</Text>
        </View>
        <Text style={styles.postResultCaption} numberOfLines={3}>{item.caption}</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyComp = ({ text }: { text: string }) => (
    <View style={styles.emptyWrap}><Text style={styles.emptyText}>{text}</Text></View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <View style={styles.inputWrap}>
            <Ionicons name="search-outline" size={18} color="#AAAAAA" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Cerca utenti, opere, gruppi…"
              placeholderTextColor="#AAAAAA"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="#AAAAAA" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab bar — sempre visibile */}
        <View style={styles.tabRow}>
          {([
            { key: 'utenti',  label: 'Persone', icon: 'people-outline' },
            { key: 'gruppi',  label: 'Gruppi',  icon: 'people-circle-outline' },
            { key: 'post',    label: 'Post',    icon: 'images-outline' },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t.key); }}>
              <Ionicons name={t.icon as any} size={18} color={tab === t.key ? ORANGE : '#AAA'} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── PERSONE ── */}
            {tab === 'utenti' && (
              <FlatList
                data={query ? users : suggestedUsers}
                keyExtractor={i => i.id}
                renderItem={renderUser}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={!query ? <Text style={styles.sectionHeader}>Persone consigliate</Text> : null}
                ListEmptyComponent={<EmptyComp text={query ? 'Nessun utente trovato' : 'Nessuna persona consigliata'} />}
              />
            )}
            {/* ── GRUPPI ── */}
            {tab === 'gruppi' && (
              <FlatList
                data={query ? groups : suggestedGroups}
                keyExtractor={i => i.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={!query ? <Text style={styles.sectionHeader}>Gruppi consigliati</Text> : null}
                ListEmptyComponent={<EmptyComp text={query ? 'Nessun gruppo trovato' : 'Nessun gruppo disponibile'} />}
                renderItem={({ item }) => {
                  const joined = joinedIds.has(item.id);
                  return (
                    <TouchableOpacity style={styles.groupRow} activeOpacity={0.75} onPress={() => { if (onGroupPress) { onClose(); onGroupPress(item.id); } }}>
                      {item.coverUrl
                        ? <Image source={{ uri: item.coverUrl }} style={styles.groupThumb} />
                        : <View style={[styles.groupThumb, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}><Ionicons name="people" size={22} color="#CCC" /></View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.groupName}>{item.name}</Text>
                        <View style={styles.groupMeta}>
                          <Ionicons name={item.isPrivate ? 'lock-closed-outline' : 'globe-outline'} size={12} color="#AAA" />
                          <Text style={styles.groupMetaText}>{item.isPrivate ? 'Privato' : 'Pubblico'} · {item.memberCount.toLocaleString()} membri</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={[styles.groupJoinBtn, joined && { backgroundColor: ORANGE, borderColor: ORANGE }]} onPress={() => toggleJoinGroup(item.id)} activeOpacity={0.75}>
                        <Text style={[styles.groupJoinText, joined && { color: '#fff' }]}>{joined ? '✓ Iscritto' : 'Iscriviti'}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            {/* ── POST ── */}
            {tab === 'post' && (
              <FlatList
                data={query ? posts : suggestedPosts}
                keyExtractor={i => i.id}
                renderItem={renderPost}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={!query ? <Text style={styles.sectionHeader}>Post recenti</Text> : null}
                ListEmptyComponent={<EmptyComp text={query ? 'Nessun post trovato' : 'Nessun post disponibile'} />}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  searchBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 12 : 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  backBtn:     { padding: 4 },
  inputWrap:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  textInput:   { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#111' },
  tabRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabBtn:      { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', gap: 3, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:{ borderBottomColor: ORANGE },
  tabText:     { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#AAAAAA' },
  tabTextActive:{ color: ORANGE },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  emptyWrap:   { alignItems: 'center', paddingVertical: 40 },
  emptyText:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#AAAAAA' },
  suggestLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#AAAAAA', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  sectionHeader: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#AAAAAA', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },

  unifiedContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  unifiedSection: { marginBottom: 24 },
  unifiedSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  unifiedSectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: ORANGE, letterSpacing: 0.5 },

  resultRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F6F6F6' },
  resultAvatar:   { width: 46, height: 46, borderRadius: 23, backgroundColor: '#EEE', marginRight: 12 },
  resultMeta:     { flex: 1 },
  resultName:     { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#111', marginBottom: 2 },
  resultSub:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#888' },
  followBtn:      { borderWidth: 1.5, borderColor: ORANGE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  followBtnActive:{ backgroundColor: ORANGE },
  followBtnText:  { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: ORANGE },
  followBtnTextActive: { color: '#fff' },

  postResult:      { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F6F6F6', gap: 12 },
  postThumb:       { width: 72, height: 72, borderRadius: 10, backgroundColor: '#EEE' },
  postResultMeta:  { flex: 1 },
  postResultAuthor:{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  postResultAvatar:{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEE' },
  postResultUsername: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#888' },
  postResultCaption:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#111', lineHeight: 19 },

  groupRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  groupThumb:    { width: 52, height: 52, borderRadius: 12, backgroundColor: '#EEE' },
  groupName:     { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#111', marginBottom: 4 },
  groupMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupMetaText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA' },
  groupJoinBtn:  { borderWidth: 1.5, borderColor: ORANGE, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  groupJoinText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: ORANGE },
});
