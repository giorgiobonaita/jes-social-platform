import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
}

type AdminTab = 'users' | 'reports' | 'blacklist';

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminPanelModal({ visible, onClose, onUserPress }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('users');

  // ── Utenti ──
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');

  // ── Segnalazioni ──
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // ── Blacklist ──
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (data) setMyId(data.id);
    })();
    loadUsers();
    loadReports();
    loadBlacklist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, search]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    let q = supabase
      .from('users')
      .select('id, username, name, role, is_banned, avatar_url, email, created_at, suspended_at, role_level, discipline, nationality')
      .order('created_at', { ascending: false })
      .limit(40);
    if (search.trim()) q = q.ilike('username', `%${search.trim()}%`);
    const { data, error } = await q;
    setLoadingUsers(false);
    if (!error && data) setUsers(data);
  };

  const loadReports = async () => {
    setLoadingReports(true);
    const { data } = await supabase
      .from('reports')
      .select('id, type, description, status, created_at, post_id, reporter_id, reported_user_id')
      .order('created_at', { ascending: false })
      .limit(50);
    setLoadingReports(false);
    setReports(data || []);
  };

  const loadBlacklist = async () => {
    setLoadingBlacklist(true);
    const { data } = await supabase.from('blacklist_words').select('id, word, created_at').order('created_at', { ascending: false });
    setLoadingBlacklist(false);
    setBlacklist(data || []);
  };

  const toggleBan = async (id: string, currentlyBanned: boolean) => {
    Alert.alert('Conferma', `Vuoi ${currentlyBanned ? 'sbloccare' : 'bannare'} questo utente?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Sì', onPress: async () => {
          const { error } = await supabase.from('users').update({
            is_banned: !currentlyBanned,
            suspended_at: currentlyBanned ? null : new Date().toISOString(),
          }).eq('id', id);
          if (!error) loadUsers();
      }}
    ]);
  };

  const promoteToAdmin = async (id: string) => {
    Alert.alert('Promuovi Admin', 'Vuoi far diventare questo utente un amministratore?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Sì', onPress: async () => {
          await supabase.from('users').update({ role: 'admin', role_level: 3 }).eq('id', id);
          loadUsers();
      }}
    ]);
  };

  const updateReportStatus = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id);
    loadReports();
  };

  const addWord = async () => {
    const w = newWord.trim().toLowerCase();
    if (!w || !myId) return;
    await supabase.from('blacklist_words').insert({ word: w, added_by: myId });
    setNewWord('');
    loadBlacklist();
  };

  const removeWord = async (id: string) => {
    await supabase.from('blacklist_words').delete().eq('id', id);
    loadBlacklist();
  };

  const statusColor = (r: any) =>
    r.status === 'reviewed' ? '#34C759' : r.status === 'dismissed' ? '#AAA' : ORANGE;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pannello Admin</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['users', 'reports', 'blacklist'] as AdminTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            >
              <Ionicons
                name={t === 'users' ? 'people-outline' : t === 'reports' ? 'flag-outline' : 'remove-circle-outline'}
                size={16}
                color={tab === t ? ORANGE : '#888'}
              />
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'users' ? 'Utenti' : t === 'reports' ? 'Segnalazioni' : 'Blacklist'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB UTENTI ── */}
        {tab === 'users' && (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={20} color="#AAA" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cerca per username…"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {loadingUsers ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={users}
                keyExtractor={it => it.id}
                contentContainerStyle={{ padding: 12 }}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <TouchableOpacity
                      onPress={() => { if (onUserPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUserPress(item.id); } }}
                      activeOpacity={0.7}
                      style={styles.userLeft}
                    >
                      <AvatarImg uri={item.avatar_url} size={44} style={styles.avatar} />
                      <View style={styles.userInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={styles.userName}>{item.username}</Text>
                          {item.role === 'admin' && <Ionicons name="shield" size={12} color={ORANGE} />}
                          {item.is_banned && <Ionicons name="ban" size={12} color="#FF3B30" />}
                        </View>
                        <Text style={styles.userSub}>{item.name}{item.discipline ? ` · ${item.discipline}` : ''}</Text>
                        {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
                        {item.nationality ? <Text style={styles.userEmail}>🌍 <Text style={{ color: '#555', fontFamily: 'PlusJakartaSans_600SemiBold' }}>Nationality:</Text> {item.nationality}</Text> : null}
                        <Text style={styles.userMeta}>
                          Iscritto: {fmtDate(item.created_at)}
                          {item.suspended_at ? `  ·  Sospeso: ${fmtDate(item.suspended_at)}` : ''}
                        </Text>
                        <View style={styles.statusBadge}>
                          <View style={[styles.statusDot, { backgroundColor: item.is_banned ? '#FF3B30' : '#34C759' }]} />
                          <Text style={styles.statusText}>{item.is_banned ? 'Sospeso' : 'Attivo'}</Text>
                          <Text style={styles.roleLevelText}>Livello {item.role_level ?? 1}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => promoteToAdmin(item.id)}>
                        <Ionicons name="star-outline" size={20} color="#111" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => toggleBan(item.id, item.is_banned)}>
                        <Ionicons name={item.is_banned ? 'lock-open-outline' : 'lock-closed-outline'} size={20} color={item.is_banned ? '#34C759' : '#FF3B30'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </>
        )}

        {/* ── TAB SEGNALAZIONI ── */}
        {tab === 'reports' && (
          loadingReports ? <ActivityIndicator color={ORANGE} style={{ marginTop: 20 }} /> : (
            <FlatList
              data={reports}
              keyExtractor={it => it.id}
              contentContainerStyle={{ padding: 12 }}
              ListEmptyComponent={<Text style={styles.emptyText}>Nessuna segnalazione</Text>}
              renderItem={({ item }) => (
                <View style={styles.reportCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="flag" size={14} color={statusColor(item)} />
                    <Text style={[styles.reportType, { color: statusColor(item) }]}>{item.type?.toUpperCase()}</Text>
                    <Text style={styles.reportDate}>{fmtDate(item.created_at)}</Text>
                  </View>
                  {item.description ? <Text style={styles.reportDesc}>{item.description}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={styles.reportBtn} onPress={() => updateReportStatus(item.id, 'reviewed')}>
                      <Text style={styles.reportBtnText}>Revisiona</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.reportBtn, { backgroundColor: '#F5F5F5' }]} onPress={() => updateReportStatus(item.id, 'dismissed')}>
                      <Text style={[styles.reportBtnText, { color: '#888' }]}>Ignora</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )
        )}

        {/* ── TAB BLACKLIST ── */}
        {tab === 'blacklist' && (
          <>
            <View style={styles.addWordRow}>
              <TextInput
                style={styles.addWordInput}
                placeholder="Aggiungi parola…"
                value={newWord}
                onChangeText={setNewWord}
                autoCapitalize="none"
                onSubmitEditing={addWord}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addWordBtn} onPress={addWord}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            {loadingBlacklist ? <ActivityIndicator color={ORANGE} style={{ marginTop: 20 }} /> : (
              <FlatList
                data={blacklist}
                keyExtractor={it => it.id}
                contentContainerStyle={{ padding: 12 }}
                ListEmptyComponent={<Text style={styles.emptyText}>Nessuna parola in blacklist</Text>}
                renderItem={({ item }) => (
                  <View style={styles.wordRow}>
                    <Ionicons name="remove-circle-outline" size={18} color="#FF3B30" />
                    <Text style={styles.wordText}>{item.word}</Text>
                    <Text style={styles.wordDate}>{fmtDate(item.created_at)}</Text>
                    <TouchableOpacity onPress={() => removeWord(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  headerBtn:  { width: 40 },

  tabBar:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: ORANGE },
  tabText:      { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: '#888' },
  tabTextActive: { color: ORANGE },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', margin: 12, paddingHorizontal: 12, borderRadius: 12, height: 44, gap: 8 },
  searchInput:  { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },

  userCard:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  userLeft:   { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEE' },
  userInfo:   { flex: 1, marginLeft: 12 },
  userName:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
  userSub:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#666', marginTop: 1 },
  userEmail:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  userMeta:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAAAAA', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, color: '#555' },
  roleLevelText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAAAAA' },
  actions:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn:  { padding: 6 },

  reportCard: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, marginBottom: 10 },
  reportType: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  reportDate: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAAAAA', marginLeft: 'auto' },
  reportDesc: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#444', lineHeight: 18 },
  reportBtn:  { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center' },
  reportBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#fff' },

  addWordRow:   { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  addWordInput: { flex: 1, height: 44, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14 },
  addWordBtn:   { width: 44, height: 44, backgroundColor: ORANGE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wordRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  wordText:     { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, flex: 1, color: '#111' },
  wordDate:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAAAAA' },
  emptyText:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#AAAAAA', textAlign: 'center', marginTop: 40 },
});
