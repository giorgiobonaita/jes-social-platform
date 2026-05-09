import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, Platform, SafeAreaView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Keyboard,
} from 'react-native';
import AvatarImg from './AvatarImg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { sendPushNotification } from '../lib/notifications';
import { containsBlacklistedWord } from '../lib/blacklist';

const ORANGE = '#F07B1D';

interface Comment {
  id: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  timeAgo: string;
  userId: string;
  parentId: string | null;
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} g`;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  postAuthorId?: string | null;
}

export default function CommentsModal({ visible, onClose, postId, postAuthorId }: CommentsModalProps) {
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [inputText, setInputText]         = useState('');
  const [loading, setLoading]             = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('tu');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef  = useRef<FlatList>(null);

  // Carica utente corrente una volta sola
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('id, avatar_url, username')
        .eq('auth_id', user.id)
        .single();
      if (data) {
        setCurrentDbUserId(data.id);
        setCurrentAvatar(data.avatar_url ?? null);
        setCurrentUsername(data.username || 'tu');
      }
    })();
  }, []);

  // Carica commenti reali quando cambia postId
  useEffect(() => {
    if (!postId || !visible) return;
    setLoading(true);
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('comments')
          .select('id, text, created_at, user_id, parent_id')
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
          .limit(80);

        if (error || !rows) return;

        const userIds = [...new Set(rows.map((c: any) => c.user_id).filter(Boolean))];
        const userMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users').select('id, username, avatar_url').in('id', userIds);
          (users || []).forEach((u: any) => { userMap[u.id] = u; });
        }

        setLocalComments(rows.map((c: any) => ({
          id:        c.id,
          username:  userMap[c.user_id]?.username  || 'utente',
          avatarUrl: userMap[c.user_id]?.avatar_url ?? null,
          text:      c.text || '',
          timeAgo:   formatTimeAgo(c.created_at),
          userId:    c.user_id,
          parentId:  c.parent_id ?? null,
        })));
      } finally {
        setLoading(false);
      }
    })();
  }, [postId, visible]);

  // Scroll to bottom when comments load
  useEffect(() => {
    if (!loading && localComments.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
    }
  }, [loading]);

  // Realtime
  useEffect(() => {
    if (!postId || !visible) return;
    const channel = supabase
      .channel(`comments_post_${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, async (payload) => {
        const c = payload.new as any;
        if (c.user_id === currentDbUserId) return;
        const { data: u } = await supabase
          .from('users').select('username, avatar_url').eq('id', c.user_id).single();
        setLocalComments(prev => [...prev, {
          id:        c.id,
          username:  u?.username  || 'utente',
          avatarUrl: u?.avatar_url ?? null,
          text:      c.text || '',
          timeAgo:   'ora',
          userId:    c.user_id,
          parentId:  c.parent_id ?? null,
        }]);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, visible, currentDbUserId]);

  const sendComment = async () => {
    const text = inputText.trim();
    if (!text || !postId || !currentDbUserId) return;
    const blocked = await containsBlacklistedWord(text);
    if (blocked) {
      Alert.alert('Commento non consentito', `Il testo contiene una parola non ammessa: "${blocked}".`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parentId = replyingTo?.id ?? null;
    setInputText('');
    setReplyingTo(null);

    const tempId = `temp_${Date.now()}`;
    setLocalComments(prev => [...prev, {
      id: tempId,
      username: currentUsername,
      avatarUrl: currentAvatar,
      text,
      timeAgo: 'ora',
      userId: currentDbUserId,
      parentId,
    }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentDbUserId,
      text,
      ...(parentId ? { parent_id: parentId } : {}),
    });

    if (error) {
      setLocalComments(prev => prev.filter(c => c.id !== tempId));
      Alert.alert('Errore', 'Impossibile inviare il commento. Riprova.');
      return;
    }

    if (parentId) {
      // Notifica risposta a commento
      const parentComment = localComments.find(c => c.id === parentId);
      const parentAuthorId = parentComment?.userId;
      if (parentAuthorId && parentAuthorId !== currentDbUserId) {
        supabase.from('notifications').insert({
          user_id:  parentAuthorId,
          actor_id: currentDbUserId,
          type:     'comment_reply',
          post_id:  postId,
        }).then(() => {});
        sendPushNotification(parentAuthorId, '↩️ Risposta al commento', 'Qualcuno ha risposto al tuo commento', { type: 'comment_reply', post_id: postId }).catch(() => {});
      }
    } else if (postAuthorId && postAuthorId !== currentDbUserId) {
      supabase.from('notifications').insert({
        user_id:  postAuthorId,
        actor_id: currentDbUserId,
        type:     'comment',
        post_id:  postId,
      }).then(() => {});
      sendPushNotification(postAuthorId, '💬 Nuovo commento', 'Qualcuno ha commentato il tuo post', { type: 'comment', post_id: postId }).catch(() => {});
    }
  };

  const startReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, username: comment.username });
    inputRef.current?.focus();
  };

  const isMine = (item: Comment) => item.userId === currentDbUserId;

  // Build flat list: top-level first, then replies directly after parent
  const flatList = React.useMemo(() => {
    const topLevel = localComments.filter(c => !c.parentId);
    const repliesMap: Record<string, Comment[]> = {};
    localComments.filter(c => c.parentId).forEach(c => {
      if (!repliesMap[c.parentId!]) repliesMap[c.parentId!] = [];
      repliesMap[c.parentId!].push(c);
    });
    const result: Array<Comment & { isReply: boolean }> = [];
    topLevel.forEach(c => {
      result.push({ ...c, isReply: false });
      (repliesMap[c.id] || []).forEach(r => result.push({ ...r, isReply: true }));
    });
    return result;
  }, [localComments]);

  const renderComment = ({ item, index }: { item: Comment & { isReply: boolean }; index: number }) => {
    const mine = isMine(item);
    const prev = flatList[index - 1];
    const showAvatar = !mine && (!prev || prev.userId !== item.userId || prev.isReply !== item.isReply);
    const showName   = !mine && (!prev || prev.userId !== item.userId || prev.isReply !== item.isReply);

    return (
      <View style={[s.msgRow, mine ? s.msgRowMine : s.msgRowOther, item.isReply && s.msgRowReply]}>
        {!mine && (
          <View style={s.avatarCol}>
            {showAvatar
              ? <AvatarImg uri={item.avatarUrl} size={item.isReply ? 26 : 32} seed={item.username} />
              : <View style={{ width: item.isReply ? 26 : 32 }} />
            }
          </View>
        )}

        <View style={[s.bubbleWrap, mine ? s.bubbleWrapMine : s.bubbleWrapOther]}>
          {showName && (
            <Text style={[s.bubbleName, item.isReply && s.bubbleNameReply]}>{item.username}</Text>
          )}
          <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
            {item.isReply && item.parentId && (() => {
              const parent = localComments.find(c => c.id === item.parentId);
              if (parent) {
                return (
                  <Text style={[s.replyTag, mine && s.replyTagMine]}>@{parent.username}</Text>
                );
              }
              return null;
            })()}
            <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{item.text}</Text>
          </View>
          <View style={[s.timeRow, mine && s.timeRowMine]}>
            <Text style={[s.bubbleTime, mine && s.bubbleTimeMine]}>{item.timeAgo}</Text>
            {!mine && (
              <TouchableOpacity onPress={() => startReply(item)} style={s.replyBtn}>
                <Text style={s.replyBtnText}>Rispondi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.dragHandle} />
          <Text style={s.headerTitle}>Commenti</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 52 : 24}
        >
          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginTop: 40, flex: 1 }} />
          ) : (
            <FlatList
              ref={listRef}
              data={flatList}
              keyExtractor={item => item.id}
              renderItem={renderComment}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              ListEmptyComponent={
                <View style={s.emptyWrap}>
                  <Ionicons name="chatbubble-outline" size={36} color="#DDD" />
                  <Text style={s.emptyTitle}>Nessun commento</Text>
                  <Text style={s.emptyText}>Sii il primo a condividere il tuo pensiero.</Text>
                </View>
              }
            />
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <View style={s.replyIndicator}>
              <Text style={s.replyIndicatorText}>Risposta a <Text style={s.replyIndicatorName}>@{replyingTo.username}</Text></Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input bar */}
          <View style={s.inputBar}>
            <AvatarImg uri={currentAvatar} size={34} seed={currentUsername} />
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder={replyingTo ? `Rispondi a @${replyingTo.username}…` : 'Scrivi un commento…'}
              placeholderTextColor="#AAAAAA"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendComment}
              style={[s.sendBtn, !inputText.trim() && s.sendBtnOff]}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  flex:      { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
    position: 'relative',
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: '#D8D8D8',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#111',
    marginTop: 14,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    bottom: 12,
  },

  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },

  // ── Messaggio ──
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  msgRowOther: { justifyContent: 'flex-start' },
  msgRowMine:  { justifyContent: 'flex-end' },
  msgRowReply: { marginLeft: 38, marginTop: 2 },

  avatarCol: { marginRight: 6, alignSelf: 'flex-end', marginBottom: 2 },

  bubbleWrap:      { maxWidth: '72%' },
  bubbleWrapOther: { alignItems: 'flex-start' },
  bubbleWrapMine:  { alignItems: 'flex-end' },

  bubbleName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
    marginLeft: 4,
  },
  bubbleNameReply: { fontSize: 10 },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleMine: {
    backgroundColor: ORANGE,
    borderBottomRightRadius: 4,
  },

  replyTag: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: ORANGE,
    marginBottom: 2,
  },
  replyTagMine: { color: 'rgba(255,255,255,0.8)' },

  bubbleText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#111',
    lineHeight: 20,
  },
  bubbleTextMine: { color: '#fff' },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    marginLeft: 4,
    marginRight: 4,
  },
  timeRowMine: { justifyContent: 'flex-end' },

  bubbleTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: '#AAAAAA',
  },
  bubbleTimeMine: { textAlign: 'right' },

  replyBtn: { paddingVertical: 2 },
  replyBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#888',
  },

  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF8F2',
    borderTopWidth: 1,
    borderTopColor: '#FFE4CC',
  },
  replyIndicatorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#888',
  },
  replyIndicatorName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: ORANGE,
  },

  emptyWrap:  { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#111' },
  emptyText:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#AAAAAA' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 14 : 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#111',
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: '#D0D0D0' },
});
