import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GroupDetail, { Group } from './GroupDetailModal';
import { supabase } from '../lib/supabase';
import { t } from '../lib/i18n';

const ORANGE = '#F07B1D';

type Screen = 'list' | 'detail' | 'create';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPostPublished?: (post: any) => void;
  initialGroupId?: string; // apre direttamente quel gruppo
}

const OFFICIAL_GROUPS = [
  'Pittura', 'Scultura', 'Moda e Fashion', 'Antiquariato', 'Letteratura', 'Fotografia', 'Cucina Chef', 'Tattoo',
  'Design', 'Architettura', 'Archeologia', 'Storia', 'Recitazione e Danza',
  'Musica', 'Fumettistica', 'Arte di Strada', 'Partner'
];

export default function GroupsModal({ visible, onClose, onPostPublished, initialGroupId }: Props) {
  const [screen, setScreen] = useState<Screen>('list');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [search, setSearch] = useState('');

  // Form crea gruppo
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const filteredGroups = useMemo(() =>
    groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  );

  // Carica utente e gruppi da Supabase
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
    
    let loadedGroups = grps.map((g: any) => ({
      id:          g.id,
      name:        g.name || '',
      description: g.description || '',
      members:     memberCounts[g.id] || 0,
      coverUrl:    g.cover_url || '',
      isPrivate:   g.is_private || false,
    }));
    
    // Sort: Official groups first
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
    
    // Auto-create missing official groups silently
    if (dbUserId) {
      const missing = OFFICIAL_GROUPS.filter(name => !loadedGroups.some((g:any) => g.name === name));
      if (missing.length > 0) {
        const toInsert = missing.map(name => ({
          name,
          description: `${t('groups_official_prefix')} ${name}`,
          is_private: false,
          created_by: dbUserId,
        }));
        await supabase.from('groups').insert(toInsert);
        // Will refresh on next open
      }
    }
  }, []);

  useEffect(() => {
    if (visible) loadGroups();
  }, [visible, loadGroups]);

  // Quando vengono passati groups e un initialGroupId, naviga direttamente al gruppo
  useEffect(() => {
    if (!initialGroupId || groups.length === 0) return;
    const target = groups.find(g => g.id === initialGroupId);
    if (target) {
      setOpenGroup(target);
      setScreen('detail');
    }
  }, [initialGroupId, groups]);

  const goToGroup = (group: Group) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenGroup(group);
    setScreen('detail');
  };

  const goBack = () => {
    setOpenGroup(null);
    setScreen('list');
  };

  const toggleJoin = async (id: string) => {
    if (!myId) return;
    const wasJoined = joinedIds.has(id);
    setJoinedIds(prev => {
      const next = new Set(prev);
      wasJoined ? next.delete(id) : next.add(id);
      return next;
    });
    setGroups(prev => prev.map(g =>
      g.id !== id ? g : { ...g, members: wasJoined ? g.members - 1 : g.members + 1 }
    ));
    if (wasJoined) {
      await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', myId);
    } else {
      await supabase.from('group_members').insert({ group_id: id, user_id: myId });
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !myId) return;
    const { data: g, error } = await supabase.from('groups').insert({
      name:        newName.trim(),
      description: newDesc.trim() || t('groups_default_desc'),
      is_private:  false,
      created_by:  myId,
    }).select('id, name, description, cover_url, is_private').single();
    if (error || !g) return;
    await supabase.from('group_members').insert({ group_id: g.id, user_id: myId });
    const newGroup: Group = {
      id: g.id, name: g.name, description: g.description || '',
      members: 1, coverUrl: g.cover_url || '', isPrivate: g.is_private || false,
    };
    setGroups(prev => [newGroup, ...prev]);
    setJoinedIds(prev => new Set([...prev, g.id]));
    setNewName(''); setNewDesc(''); setIsPrivate(false);
    setScreen('list');
  };

  const handleClose = () => {
    setScreen('list');
    setOpenGroup(null);
    setSearch('');
    onClose();
  };

  // ── Render card gruppo ─────────────────────────────────────────────────────
  const renderGroup = ({ item }: { item: Group }) => {
    const joined = joinedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, OFFICIAL_GROUPS.includes(item.name) && styles.cardOfficial]}
        onPress={() => goToGroup(item)}
        activeOpacity={0.88}
      >
        <View style={styles.cardCoverWrap}>
          <Image source={{ uri: item.coverUrl }} style={styles.cardCover} resizeMode="cover" />
          <View style={[styles.cardBadge, item.isPrivate ? styles.badgePrivate : styles.badgePublic]}>
            <Ionicons name={item.isPrivate ? 'lock-closed' : 'globe'} size={11} color="#fff" />
            <Text style={styles.cardBadgeText}>{item.isPrivate ? t('groups_private') : t('groups_public')}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardNameRow}>
            {OFFICIAL_GROUPS.includes(item.name) && (
              <Ionicons name="pin" size={13} color={ORANGE} />
            )}
            <Text style={styles.cardName}>{item.name}</Text>
            {OFFICIAL_GROUPS.includes(item.name) && (
              <Ionicons name="checkmark-circle" size={16} color={ORANGE} />
            )}
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.cardMeta}>
              <Ionicons name="people-outline" size={13} color="#888" />
              <Text style={styles.cardMetaText}>{item.members.toLocaleString()} {t('groups_members')}</Text>
              {joined && (
                <View style={styles.memberPill}>
                  <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                  <Text style={styles.memberPillText}>{t('groups_member')}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, joined && styles.joinBtnJoined]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleJoin(item.id); }}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
                {joined ? t('groups_joined') : t('groups_join')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>

        {/* ── SCHERMATA LISTA ── */}
        {screen === 'list' && (
          <KeyboardAvoidingView 
            style={styles.flex} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.headerBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={26} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('groups_title')}</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setScreen('create')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createBtnText}>{t('groups_create')}</Text>
              </TouchableOpacity>
            </View>

            {/* Barra ricerca */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#AAA" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('groups_search')}
                placeholderTextColor="#CCC"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#CCC" />
                </TouchableOpacity>
              )}
            </View>

            {loading ? <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} /> : (
            <FlatList
              data={filteredGroups}
              keyExtractor={item => item.id}
              renderItem={renderGroup}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="search-outline" size={40} color="#DDD" />
                  <Text style={styles.emptyText}>{t('groups_not_found')}</Text>
                </View>
              }
            />
            )}
          </KeyboardAvoidingView>
        )}

        {/* ── SCHERMATA DETTAGLIO GRUPPO ── */}
        {screen === 'detail' && openGroup && (
          <GroupDetail
            group={openGroup}
            joined={joinedIds.has(openGroup.id)}
            onBack={goBack}
            onToggleJoin={() => toggleJoin(openGroup.id)}
            onPostPublished={onPostPublished}
          />
        )}

        {/* ── SCHERMATA CREA GRUPPO ── */}
        {screen === 'create' && (
          <KeyboardAvoidingView 
            style={styles.flex} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setScreen('list')} style={styles.headerBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('groups_new')}</Text>
              <View style={{ width: 60 }} />
            </View>

            <FlatList
              data={[]}
              keyExtractor={() => ''}
              renderItem={() => null}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View style={styles.formWrap}>
                  <Text style={styles.formLabel}>{t('groups_name_label')} <Text style={styles.req}>*</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={t('groups_name_placeholder')}
                    placeholderTextColor="#CCC"
                    value={newName}
                    onChangeText={setNewName}
                    maxLength={50}
                    autoFocus
                  />

                  <Text style={styles.formLabel}>{t('groups_desc_label')}</Text>
                  <TextInput
                    style={[styles.formInput, { minHeight: 90, textAlignVertical: 'top' }]}
                    placeholder={t('groups_desc_placeholder')}
                    placeholderTextColor="#CCC"
                    value={newDesc}
                    onChangeText={setNewDesc}
                    multiline
                    maxLength={200}
                  />

                  {/* Tutti i gruppi sono pubblici */}

                  <TouchableOpacity
                    style={[styles.confirmBtn, !newName.trim() && styles.confirmBtnOff]}
                    onPress={handleCreate}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmBtnText}>{t('groups_create_btn')}</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </KeyboardAvoidingView>
        )}

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F5F5F5' },
  flex:               { flex: 1 },

  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerBtn:          { width: 40 },
  headerTitle:        { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: '#111' },
  createBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  createBtnText:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff' },

  searchBar:          { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEEEEE' },
  searchInput:        { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#111' },

  list:               { padding: 12, gap: 12, paddingBottom: 40 },

  card:               { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardOfficial:       { borderWidth: 1.5, borderColor: ORANGE + '55' },
  cardCoverWrap:      { position: 'relative' },
  cardCover:          { width: '100%', height: 130 },
  cardBadge:          { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePublic:        { backgroundColor: 'rgba(52,199,89,0.92)' },
  badgePrivate:       { backgroundColor: 'rgba(90,90,90,0.88)' },
  cardBadgeText:      { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#fff' },
  cardBody:           { padding: 14, gap: 6 },
  cardNameRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardName:           { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#111' },
  cardDesc:           { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#777', lineHeight: 19 },
  cardFooter:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cardMeta:           { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 },
  cardMetaText:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#888' },
  memberPill:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#34C75914', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  memberPillText:     { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#34C759' },
  joinBtn:            { borderWidth: 1.5, borderColor: ORANGE, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  joinBtnJoined:      { backgroundColor: ORANGE, borderColor: ORANGE },
  joinBtnText:        { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: ORANGE },
  joinBtnTextJoined:  { color: '#fff' },

  emptyWrap:          { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:          { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#CCC' },

  formWrap:           { padding: 20, gap: 0 },
  formLabel:          { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#333', marginBottom: 8, marginTop: 20 },
  req:                { color: ORANGE },
  formInput:          { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#111', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, backgroundColor: '#fff' },

  visRow:             { flexDirection: 'row', gap: 12, marginBottom: 10 },
  visCard:            { flex: 1, borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#fff' },
  visCardActive:      { borderColor: ORANGE, backgroundColor: '#FFF8F3' },
  visLabel:           { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#666' },
  visLabelActive:     { color: ORANGE },
  visSub:             { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA', textAlign: 'center' },

  confirmBtn:         { backgroundColor: ORANGE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  confirmBtnOff:      { backgroundColor: '#E0E0E0' },
  confirmBtnText:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },
});
