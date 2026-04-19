import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';

interface Conversation {
  otherId:     string;
  name:        string;
  avatarUrl:   string | null;
  lastMessage: string;
  time:        string;
  unread:      number;
}

interface Message {
  id:         string;
  text:       string;
  mine:       boolean;
  time:       string;
  created_at: string;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Ieri';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  openWithUserId?: string | null;
  openWithName?: string;
  openWithAvatar?: string | null;
}

export default function ChatModal({ visible, onClose, openWithUserId, openWithName, openWithAvatar }: Props) {
  const [myId, setMyId]                 = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]         = useState<string | null>(null);  // otherId
  const [activeName, setActiveName]     = useState('');
  const [activeAvatar, setActiveAvatar] = useState('');
  const [messages, setMessages]         = useState<Message[]>([]);
  const [inputText, setInputText]       = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs]  = useState(false);
  const [isSending, setIsSending]      = useState(false);
  const [suggested, setSuggested]      = useState<{ id: string; name: string; username: string; avatarUrl: string | null }[]>([]);
  // Nuovo messaggio: ricerca utente
  const [newMsgMode, setNewMsgMode]     = useState(false);
  const [newMsgQuery, setNewMsgQuery]   = useState('');
  const [newMsgResults, setNewMsgResults] = useState<{ id: string; name: string; username: string; avatarUrl: string | null }[]>([]);
  const [loadingNewMsg, setLoadingNewMsg] = useState(false);
  const listRef    = useRef<FlatList>(null);
  const inputRef   = useRef<TextInput>(null);

  // Carica utente corrente + suggerimenti
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!data) return;
      setMyId(data.id);
      // Carica persone che segui (suggeriti per nuove chat)
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', data.id)
        .limit(20);
      const followIds = (follows || []).map((f: any) => f.following_id);
      if (followIds.length > 0) {
        const { data: suggestedUsers } = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .in('id', followIds);
        setSuggested((suggestedUsers || []).map((u: any) => ({
          id: u.id,
          name: u.name || 'Utente',
          username: u.username || '',
          avatarUrl: u.avatar_url || null,
        })));
      }
    })();
  }, []);

  // Carica conversazioni quando il modal è visibile
  const loadConversations = useCallback(async () => {
    if (!myId) return;
    setLoadingConvs(true);
    // Carica tutti i messaggi dove sono sender o receiver
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, read, created_at')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });

    if (!msgs || msgs.length === 0) { setLoadingConvs(false); return; }

    // Raggruppa per interlocutore
    const convMap: Record<string, { msg: any; unread: number }> = {};
    for (const m of msgs) {
      const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
      if (!convMap[otherId]) {
        convMap[otherId] = {
          msg: m,
          unread: (!m.read && m.receiver_id === myId) ? 1 : 0,
        };
      } else if (!m.read && m.receiver_id === myId) {
        convMap[otherId].unread++;
      }
    }

    // Carica info utenti
    const otherIds = Object.keys(convMap);
    const { data: users } = await supabase.from('users').select('id, name, username, avatar_url').in('id', otherIds);
    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => { userMap[u.id] = u; });

    const convList: Conversation[] = otherIds.map(otherId => {
      const u = userMap[otherId] || {};
      return {
        otherId,
        name:        u.name || u.username || 'Utente',
        avatarUrl:   u.avatar_url || null,
        lastMessage: convMap[otherId].msg.content || '',
        time:        fmtTime(convMap[otherId].msg.created_at),
        unread:      convMap[otherId].unread,
      };
    });

    setConversations(convList);
    setLoadingConvs(false);
  }, [myId]);

  useEffect(() => {
    if (visible && myId) loadConversations();
  }, [visible, myId, loadConversations]);

  // Auto-apri conversazione se viene passato un utente specifico dal profilo
  useEffect(() => {
    if (!visible || !myId || !openWithUserId) return;
    openConversation(openWithUserId, openWithName || 'Utente', openWithAvatar || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, myId, openWithUserId]);

  // Realtime: aggiorna lista conversazioni quando arriva un nuovo messaggio
  useEffect(() => {
    if (!myId || !visible) return;

    const convChannel = supabase
      .channel(`convs_${myId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const m = payload.new as any;
        if (m.receiver_id !== myId) return;
        if (!activeId) loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(convChannel); };
  }, [myId, visible, activeId, loadConversations]);

  // Carica messaggi di una conversazione
  const openConversation = async (otherId: string, name: string, avatarUrl: string) => {
    setActiveId(otherId);
    setActiveName(name);
    setActiveAvatar(avatarUrl);
    setLoadingMsgs(true);
    if (!myId) return;

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read')
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
      )
      .order('created_at', { ascending: true });

    setMessages((msgs || []).map((m: any) => ({
      id:         m.id,
      text:       m.content,
      mine:       m.sender_id === myId,
      time:       fmtTime(m.created_at),
      created_at: m.created_at,
    })));

    // Segna come letti
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', otherId)
      .eq('receiver_id', myId)
      .eq('read', false);

    setConversations(prev => prev.map(c => c.otherId === otherId ? { ...c, unread: 0 } : c));
    setLoadingMsgs(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  };

  // Realtime: messaggi in arrivo nella conversazione attiva
  useEffect(() => {
    if (!activeId || !myId) return;

    const msgChannel = supabase
      .channel(`msgs_${myId}_${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const m = payload.new as any;
        // Solo messaggi ricevuti da me dall'interlocutore attivo
        if (m.receiver_id !== myId || m.sender_id !== activeId) return;
        setMessages(prev => [...prev, {
          id:         m.id,
          text:       m.content,
          mine:       false,
          time:       fmtTime(m.created_at),
          created_at: m.created_at,
        }]);
        supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      })
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [activeId, myId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !myId || !activeId || isSending) return;
    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = inputText.trim();
    inputRef.current?.setNativeProps({ text: '' });
    setInputText('');

    try {
      const { data: newMsg } = await supabase.from('messages').insert({
        sender_id:   myId,
        receiver_id: activeId,
        content:     text,
      }).select('id, sender_id, content, created_at').single();

      if (newMsg) {
        const msg: Message = {
          id:         newMsg.id,
          text:       newMsg.content,
          mine:       true,
          time:       fmtTime(newMsg.created_at),
          created_at: newMsg.created_at,
        };
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c =>
          c.otherId === activeId ? { ...c, lastMessage: text, time: fmtTime(newMsg.created_at) } : c
        ));
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Ricerca utenti per "Nuovo messaggio": seguiti prima, poi tutti gli altri
  const searchNewMsgUsers = useCallback(async (q: string) => {
    if (!myId) return;
    setLoadingNewMsg(true);
    const pattern = `%${q}%`;
    const { data } = await supabase
      .from('users')
      .select('id, name, username, avatar_url')
      .neq('id', myId)
      .or(`username.ilike.${pattern},name.ilike.${pattern}`)
      .limit(30);
    const all = (data || []).map((u: any) => ({
      id: u.id, name: u.name || 'Utente', username: u.username || '', avatarUrl: u.avatar_url || null,
    }));
    // Seguiti prima
    const followedIds = new Set(suggested.map(s => s.id));
    const sorted = [
      ...all.filter(u => followedIds.has(u.id)),
      ...all.filter(u => !followedIds.has(u.id)),
    ];
    setNewMsgResults(sorted);
    setLoadingNewMsg(false);
  }, [myId, suggested]);

  // Debounce ricerca nuovo messaggio
  const newMsgDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!newMsgMode) return;
    if (newMsgDebounce.current) clearTimeout(newMsgDebounce.current);
    if (!newMsgQuery.trim()) {
      // senza query mostra i seguiti come suggeriti
      setNewMsgResults(suggested);
      return;
    }
    newMsgDebounce.current = setTimeout(() => searchNewMsgUsers(newMsgQuery), 350);
    return () => { if (newMsgDebounce.current) clearTimeout(newMsgDebounce.current); };
  }, [newMsgQuery, newMsgMode, suggested, searchNewMsgUsers]);

  // Apre il pannello nuovo messaggio
  const openNewMsgMode = () => {
    setNewMsgQuery('');
    setNewMsgResults(suggested);
    setNewMsgMode(true);
  };

  const renderConv = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.convRow}
      onPress={() => openConversation(item.otherId, item.name, item.avatarUrl ?? '')}
      activeOpacity={0.7}
    >
      <View style={styles.convAvatarWrap}>
        <AvatarImg uri={item.avatarUrl} size={48} style={styles.convAvatar} />
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread}</Text>
          </View>
        )}
      </View>
      <View style={styles.convMeta}>
        <View style={styles.convTopRow}>
          <Text style={[styles.convName, item.unread > 0 && styles.convNameUnread]}>{item.name}</Text>
          <Text style={styles.convTime}>{item.time}</Text>
        </View>
        <Text style={[styles.convLast, item.unread > 0 && styles.convLastUnread]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const nextMsg = messages[index + 1];
    const isLastInGroup = !nextMsg || nextMsg.mine !== item.mine;
    return (
      <View style={[
        styles.msgWrap,
        item.mine ? styles.msgWrapMine : styles.msgWrapTheirs,
        !isLastInGroup && { marginBottom: 3 },
      ]}>
        {!item.mine && (
          isLastInGroup
            ? <AvatarImg uri={activeAvatar || null} size={28} seed={activeName} style={styles.msgAvatar} />
            : <View style={styles.msgAvatar} />
        )}
        <View>
          <View style={[styles.msgBubble, item.mine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
            <Text style={[styles.msgText, item.mine && styles.msgTextMine]}>{item.text}</Text>
          </View>
          {isLastInGroup && (
            <Text style={[styles.msgTime, item.mine && { textAlign: 'right' }]}>{item.time}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => {
      if (activeId) { setActiveId(null); setMessages([]); }
      else if (newMsgMode) { setNewMsgMode(false); }
      else onClose();
    }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (activeId) { setActiveId(null); setMessages([]); }
              else if (newMsgMode) { setNewMsgMode(false); }
              else onClose();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={(activeId || newMsgMode) ? 'arrow-back' : 'close'} size={24} color="#111" />
          </TouchableOpacity>
          {activeId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AvatarImg uri={activeAvatar || null} size={32} seed={activeName} />
              <Text style={styles.headerTitle}>{activeName}</Text>
            </View>
          ) : newMsgMode ? (
            <Text style={styles.headerTitle}>Nuovo messaggio</Text>
          ) : (
            <Text style={styles.headerTitle}>Messaggi</Text>
          )}
          {!activeId && !newMsgMode ? (
            <TouchableOpacity onPress={openNewMsgMode} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="create-outline" size={22} color="#111" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        {activeId ? (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {loadingMsgs ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={i => i.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.threadContent}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>Inizia la conversazione</Text>
                  </View>
                }
              />
            )}
            <View style={styles.inputBar}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder="Scrivi un messaggio…"
                placeholderTextColor="#AAAAAA"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || isSending) && { opacity: 0.4 }]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isSending}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : newMsgMode ? (
          /* ── Pannello Nuovo Messaggio ── */
          <View style={{ flex: 1 }}>
            <View style={styles.newMsgSearchBar}>
              <Ionicons name="search-outline" size={17} color="#AAAAAA" />
              <TextInput
                style={styles.newMsgInput}
                placeholder="Cerca utente…"
                placeholderTextColor="#AAAAAA"
                value={newMsgQuery}
                onChangeText={setNewMsgQuery}
                autoFocus
                autoCapitalize="none"
              />
              {newMsgQuery.length > 0 && (
                <TouchableOpacity onPress={() => setNewMsgQuery('')}>
                  <Ionicons name="close-circle" size={17} color="#AAAAAA" />
                </TouchableOpacity>
              )}
            </View>
            {!newMsgQuery && suggested.length > 0 && (
              <Text style={styles.newMsgSuggestLabel}>Suggeriti (segui già)</Text>
            )}
            {loadingNewMsg ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 24 }} />
            ) : (
              <FlatList
                data={newMsgResults}
                keyExtractor={i => i.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>Nessun utente trovato</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isFollowed = suggested.some(s => s.id === item.id);
                  return (
                    <TouchableOpacity
                      style={styles.convRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        setNewMsgMode(false);
                        openConversation(item.id, item.name, item.avatarUrl ?? '');
                      }}
                    >
                      <View style={styles.convAvatarWrap}>
                        <AvatarImg uri={item.avatarUrl} size={48} style={styles.convAvatar} />
                      </View>
                      <View style={styles.convMeta}>
                        <View style={styles.convTopRow}>
                          <Text style={styles.convName}>{item.name}</Text>
                          {isFollowed && (
                            <View style={styles.followedBadge}>
                              <Text style={styles.followedBadgeText}>Segui</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.convLast}>@{item.username}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        ) : (
          loadingConvs ? (
            <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={i => i.otherId}
              renderItem={renderConv}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={suggested.length > 0 ? (
                <View style={styles.suggestSection}>
                  <Text style={styles.suggestTitle}>Persone che segui</Text>
                  <FlatList
                    data={suggested}
                    keyExtractor={i => i.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestItem}
                        activeOpacity={0.75}
                        onPress={() => openConversation(item.id, item.name, item.avatarUrl ?? '')}
                      >
                        <AvatarImg uri={item.avatarUrl} size={48} style={styles.suggestAvatar} />
                        <Text style={styles.suggestName} numberOfLines={1}>{item.name.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ) : null}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="chatbubble-outline" size={48} color="#DDD" />
                  <Text style={styles.emptyText}>Nessun messaggio ancora</Text>
                  <Text style={[styles.emptyText, { fontSize: 12, marginTop: 4 }]}>
                    Tocca un contatto sopra per iniziare
                  </Text>
                </View>
              }
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle:  { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, color: '#111' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEE' },
  listContent:  { paddingVertical: 8 },
  emptyWrap:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  suggestSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', marginBottom: 4 },
  suggestTitle:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#AAAAAA', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  suggestItem:    { alignItems: 'center', width: 64 },
  suggestAvatar:  { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEE' },
  suggestName:    { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, color: '#333', marginTop: 5, textAlign: 'center' },
  emptyText:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#AAAAAA' },

  convRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  convAvatarWrap:{ position: 'relative', marginRight: 14 },
  convAvatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEE' },
  unreadBadge:   { position: 'absolute', top: -2, right: -2, backgroundColor: ORANGE, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  unreadText:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: '#fff' },
  convMeta:      { flex: 1 },
  convTopRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convName:      { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#111' },
  convNameUnread:{ fontFamily: 'PlusJakartaSans_700Bold' },
  convTime:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAAAAA' },
  convLast:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#888' },
  convLastUnread:{ color: '#111', fontFamily: 'PlusJakartaSans_600SemiBold' },

  threadContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  msgWrap:       { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgWrapMine:   { justifyContent: 'flex-end' },
  msgWrapTheirs: { justifyContent: 'flex-start' },
  msgAvatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EEE' },
  msgBubble:     { maxWidth: SW * 0.72, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  msgBubbleMine: { backgroundColor: ORANGE, borderBottomRightRadius: 4 },
  msgBubbleTheirs:{ backgroundColor: '#F2F2F2', borderBottomLeftRadius: 4 },
  msgText:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#111', lineHeight: 20 },
  msgTextMine:   { color: '#fff' },
  msgTime:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: '#AAAAAA', marginTop: 3, paddingHorizontal: 4 },

  inputBar:  { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 12 : 16, gap: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  textInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#111', maxHeight: 100 },
  sendBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },

  newMsgSearchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', marginHorizontal: 16, marginTop: 12, marginBottom: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, gap: 8 },
  newMsgInput:       { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#111' },
  newMsgSuggestLabel:{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#AAAAAA', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  followedBadge:     { backgroundColor: ORANGE + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  followedBadgeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: ORANGE },
});
