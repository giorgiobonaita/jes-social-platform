/**
 * GroupDetail — schermata dettaglio gruppo, NON un Modal.
 * Viene resa dentro GroupsModal tramite stack interno.
 */
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import AvatarImg from './AvatarImg';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, TextInput, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let i; let p = 0;
  let encoded1: number; let encoded2: number; let encoded3: number; let encoded4: number;
  if (base64[len - 1] === '=') base64[len - 2] === '=' ? bufferLength -= 2 : bufferLength--;
  const bytes = new Uint8Array(new ArrayBuffer(bufferLength));
  for (i = 0; i < len; i += 4) {
    encoded1 = chars.indexOf(base64[i]);
    encoded2 = chars.indexOf(base64[i + 1]);
    encoded3 = chars.indexOf(base64[i + 2]);
    encoded4 = chars.indexOf(base64[i + 3]);
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes;
}

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';
const FALLBACK = null;

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  coverUrl: string;
  isPrivate?: boolean;
}

interface Post {
  id: string;
  author: string;
  avatarUrl: string | null;
  timeAgo: string;
  text: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  liked: boolean;
  userId?: string;
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  return `${Math.floor(h / 24)} g fa`;
}

// ─── COMPOSE BOX ─────────────────────────────────────────────────────────────
// Estratto come componente memo separato: i re-render da typing
// rimangono ISOLATI qui dentro e non toccano mai l'header/FlatList.
interface ComposeBoxProps {
  myAvatar: string | null;
  myId: string | null;
  groupId: string;
  groupName: string;
  onPublished: (post: any) => void;
}

const ComposeBox = memo(function ComposeBox({ myAvatar, myId, groupId, groupName, onPublished }: ComposeBoxProps) {
  const [postText, setPostText]         = useState('');
  const [postFocused, setPostFocused]   = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [publishing, setPublishing]     = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Accesso necessario', 'Consenti la galleria nelle impostazioni.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.9 });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const publishPost = async () => {
    if (!postText.trim() || !myId || publishing) return;
    setPublishing(true);
    try {
      let imageUrl: string | null = null;
      if (selectedImage) {
        const ext = selectedImage.split('.').pop()?.toLowerCase() ?? 'jpg';
        const filePath = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const base64 = await FileSystem.readAsStringAsync(selectedImage, { encoding: 'base64' as any });
        const byteArray = decodeBase64(base64);
        const { error: upErr } = await supabase.storage.from('media').upload(filePath, byteArray, { contentType: `image/${ext}`, upsert: false });
        if (!upErr) {
          const { data } = supabase.storage.from('media').getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      const { data: post } = await supabase.from('posts').insert({
        user_id:      myId,
        caption:      postText.trim(),
        image_url:    imageUrl,
        aspect_ratio: 1,
        privacy:      'all',
        group_id:     groupId,
        group_name:   groupName,
      }).select('id').single();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const captionSnapshot = postText.trim();
      setPostText('');
      setPostFocused(false);
      setSelectedImage(null);

      if (post) {
        onPublished({
          type: 'post', id: post.id,
          author: { name: 'Tu', username: 'tu', avatarUrl: myAvatar || FALLBACK, discipline: '' },
          imageUrl: imageUrl || '', aspectRatio: 1, likesCount: 0, commentsCount: 0,
          caption: captionSnapshot, timeAgo: 'Adesso', tags: [], groupName,
          currentUserId: myId, isLiked: false,
        });
      }
    } catch {
      Alert.alert('Errore', 'Impossibile pubblicare. Riprova.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.composeBox}>
        <AvatarImg uri={myAvatar} size={40} seed="me" style={s.composeAvatar} />
        <View style={s.composeRight}>
          <TextInput
            style={s.composeInput}
            placeholder="Scrivi qualcosa nel gruppo..."
            placeholderTextColor="#BBB"
            value={postText}
            onChangeText={setPostText}
            multiline
            onFocus={() => setPostFocused(true)}
            onBlur={() => { if (!postText.trim()) setPostFocused(false); }}
          />
          {selectedImage && (
            <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
              <Image source={{ uri: selectedImage }} style={s.previewImg} resizeMode="cover" />
              <TouchableOpacity style={s.removeImg} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {(postFocused || postText.trim().length > 0) && (
            <View style={s.composeActions}>
              <TouchableOpacity style={s.imgPickBtn} onPress={pickImage} activeOpacity={0.75}>
                <Ionicons name="image-outline" size={20} color={ORANGE} />
                <Text style={s.imgPickText}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.sendBtn, (!postText.trim() || publishing) && s.sendBtnOff]}
                onPress={publishPost}
                disabled={!postText.trim() || publishing}
                activeOpacity={0.85}
              >
                {publishing
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Ionicons name="send" size={15} color="#fff" /><Text style={s.sendBtnText}>Pubblica</Text></>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});

// ─── GROUP DETAIL ─────────────────────────────────────────────────────────────
interface Props {
  group: Group;
  joined: boolean;
  onBack: () => void;
  onToggleJoin: () => void;
  onPostPublished?: (post: any) => void;
}

export default function GroupDetail({ group, joined, onBack, onToggleJoin, onPostPublished }: Props) {
  const [localJoined, setLocalJoined] = useState(joined);
  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(false);
  const [myId, setMyId]               = useState<string | null>(null);
  const [myAvatar, setMyAvatar]       = useState<string | null>(null);
  const [likedIds, setLikedIds]       = useState<Set<string>>(new Set());
  const [coverUrl, setCoverUrl]       = useState<string>(group.coverUrl || '');
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => { setLocalJoined(joined); }, [joined]);

  // Carica utente corrente
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id, avatar_url').eq('auth_id', user.id).single();
      if (data) { setMyId(data.id); setMyAvatar(data.avatar_url); }
    })();
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data: rawPosts } = await supabase
      .from('posts')
      .select('id, caption, image_url, created_at, user_id')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false });

    if (!rawPosts || rawPosts.length === 0) { setLoading(false); return; }

    const userIds = [...new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean))];
    const { data: usersData } = await supabase.from('users').select('id, name, username, avatar_url').in('id', userIds);
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });

    const postIds = rawPosts.map((p: any) => p.id);
    const [{ data: likesData }, { data: commentsData }] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id').in('post_id', postIds),
    ]);

    const likesByPost: Record<string, string[]> = {};
    (likesData || []).forEach((l: any) => {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l.user_id);
    });
    const commentsByPost: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => { commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1; });

    const { data: { user } } = await supabase.auth.getUser();
    let dbUserId = myId;
    if (!dbUserId && user) {
      const { data: u } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      dbUserId = u?.id ?? null;
    }

    setPosts(rawPosts.map((p: any) => {
      const u = userMap[p.user_id] || {};
      return {
        id:       p.id,
        author:   u.name || u.username || 'Utente',
        avatarUrl:u.avatar_url || FALLBACK,
        timeAgo:  formatTimeAgo(p.created_at),
        text:     p.caption || '',
        imageUrl: p.image_url || undefined,
        likes:    (likesByPost[p.id] || []).length,
        comments: commentsByPost[p.id] || 0,
        liked:    dbUserId ? (likesByPost[p.id] || []).includes(dbUserId) : false,
        userId:   p.user_id,
      };
    }));
    setLoading(false);
  }, [group.id, myId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const uploadCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Accesso necessario', 'Consenti la galleria nelle impostazioni.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.85, aspect: [16, 9], allowsEditing: true });
    if (result.canceled) return;
    setUploadingCover(true);
    try {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `posts/cover_${group.id}_${Date.now()}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { error: upErr } = await supabase.storage.from('media').upload(filePath, byteArray, { contentType: `image/${ext}`, upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const url = data.publicUrl;
      await supabase.from('groups').update({ cover_url: url }).eq('id', group.id);
      setCoverUrl(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare la copertina.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleToggleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalJoined(p => !p);
    onToggleJoin();
  };

  const handlePostPublished = useCallback((post: any) => {
    loadPosts();
    onPostPublished?.(post);
  }, [loadPosts, onPostPublished]);

  const toggleLike = async (id: string, userId?: string) => {
    if (!myId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isLiked = likedIds.has(id) || (posts.find(p => p.id === id)?.liked ?? false);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', myId);
    } else {
      await supabase.from('likes').insert({ post_id: id, user_id: myId });
      if (userId && userId !== myId) {
        await supabase.from('notifications').insert({ user_id: userId, sender_id: myId, type: 'like', post_id: id });
      }
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        <AvatarImg uri={item.avatarUrl} size={42} seed={item.author} style={s.postAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.postAuthor}>{item.author}</Text>
          <Text style={s.postTime}>{item.timeAgo}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color="#CCC" />
      </View>
      <Text style={s.postText}>{item.text}</Text>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={s.postImage} resizeMode="cover" /> : null}
      <View style={s.postActions}>
        <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(item.id, item.userId)} activeOpacity={0.7}>
          <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={21} color={item.liked ? ORANGE : '#999'} />
          <Text style={[s.actionCount, item.liked && { color: ORANGE }]}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={19} color="#999" />
          <Text style={s.actionCount}>{item.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Header stabile: non contiene più stato che cambia al typing
  // ComposeBox è un componente memo separato che gestisce il proprio stato
  const Header = useCallback(() => (
    <View>
      {/* Copertina */}
      <View style={s.cover}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={s.coverImg} resizeMode="cover" />
        ) : (
          <View style={[s.coverImg, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="people" size={60} color="#DDD" />
          </View>
        )}
        <View style={s.coverOverlay} />
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.typeBadge}>
          <Ionicons name="globe" size={12} color="#fff" />
          <Text style={s.typeBadgeText}>Pubblico</Text>
        </View>
        {localJoined && (
          <TouchableOpacity style={s.coverUploadBtn} onPress={uploadCover} activeOpacity={0.85}>
            {uploadingCover
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Ionicons name="camera-outline" size={15} color="#fff" /><Text style={s.coverUploadText}>Copertina</Text></>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={s.infoBox}>
        <View style={s.infoRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.groupName}>{group.name}</Text>
            <View style={s.metaRow}>
              <Ionicons name="people-outline" size={14} color="#888" />
              <Text style={s.metaText}>{group.members.toLocaleString()} membri</Text>
              {localJoined && (
                <View style={s.memberBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#34C759" />
                  <Text style={s.memberBadgeText}>Membro</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={[s.joinBtn, localJoined && s.joinBtnJoined]} onPress={handleToggleJoin} activeOpacity={0.8}>
            <Ionicons name={localJoined ? 'exit-outline' : 'add'} size={16} color={localJoined ? '#888' : '#fff'} />
            <Text style={localJoined ? s.joinTextLeave : s.joinTextJoin}>{localJoined ? 'Esci' : 'Iscriviti'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.groupDesc}>{group.description}</Text>
      </View>

      <View style={s.sep} />

      {/* ComposeBox: componente memo isolato — non causa rimount al typing */}
      {localJoined ? (
        <ComposeBox
          myAvatar={myAvatar}
          myId={myId}
          groupId={group.id}
          groupName={group.name}
          onPublished={handlePostPublished}
        />
      ) : (
        <TouchableOpacity style={s.joinBanner} onPress={handleToggleJoin} activeOpacity={0.85}>
          <Ionicons name="pencil-outline" size={20} color={ORANGE} />
          <View style={{ flex: 1 }}>
            <Text style={s.joinBannerTitle}>Iscriviti per pubblicare</Text>
            <Text style={s.joinBannerSub}>Entra nel gruppo per condividere</Text>
          </View>
          <View style={s.joinBannerBtn}><Text style={s.joinBannerBtnText}>Iscriviti</Text></View>
        </TouchableOpacity>
      )}

      <View style={s.feedHeader}>
        <Text style={s.feedHeaderText}>Post nel gruppo</Text>
        <Text style={s.feedHeaderCount}>{posts.length}</Text>
      </View>
    </View>
  ), [coverUrl, localJoined, group, myAvatar, myId, uploadingCover, posts.length, handlePostPublished]);

  return (
    <View style={s.container}>
      {loading && posts.length === 0 ? (
        <>
          <Header />
          <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
        </>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          ListHeaderComponent={Header}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="images-outline" size={40} color="#DDD" />
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#AAA', marginTop: 10 }}>
                Nessun post ancora
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  cover:            { width: SW, height: 210, position: 'relative' },
  coverImg:         { width: '100%', height: '100%' },
  coverOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  backBtn:          { position: 'absolute', top: 14, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  typeBadge:        { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(52,199,89,0.92)' },
  coverUploadBtn:   { position: 'absolute', bottom: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.52)' },
  coverUploadText:  { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#fff' },
  typeBadgeText:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#fff' },
  infoBox:          { backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 },
  infoRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  groupName:        { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: '#111', marginBottom: 6 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaText:         { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#888' },
  memberBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#34C75918', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  memberBadgeText:  { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#34C759' },
  groupDesc:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#666', lineHeight: 21 },
  joinBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ORANGE, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22 },
  joinBtnJoined:    { backgroundColor: '#F0F0F0' },
  joinTextJoin:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff' },
  joinTextLeave:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#888' },
  sep:              { height: 8, backgroundColor: '#F0F0F0' },
  composeBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff' },
  composeAvatar:    { width: 40, height: 40, borderRadius: 20, marginTop: 2 },
  composeRight:     { flex: 1, gap: 10 },
  composeInput:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#111', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, minHeight: 46, lineHeight: 22 },
  previewImg:       { width: 100, height: 100, borderRadius: 12, marginTop: 4 },
  removeImg:        { position: 'absolute', top: 2, right: -8 },
  composeActions:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imgPickBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  imgPickText:      { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: ORANGE },
  sendBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: ORANGE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  sendBtnOff:       { backgroundColor: '#E0E0E0' },
  sendBtnText:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff' },
  joinBanner:       { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 14, padding: 16, backgroundColor: '#FFF8F3', borderRadius: 18, borderWidth: 1.5, borderColor: ORANGE + '40' },
  joinBannerTitle:  { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#111', marginBottom: 3 },
  joinBannerSub:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#888' },
  joinBannerBtn:    { backgroundColor: ORANGE, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  joinBannerBtnText:{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff' },
  feedHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#F5F5F5' },
  feedHeaderText:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#AAA', flex: 1 },
  feedHeaderCount:  { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#CCC' },
  postCard:         { backgroundColor: '#fff', marginBottom: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  postHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar:       { width: 42, height: 42, borderRadius: 21 },
  postAuthor:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#111' },
  postTime:         { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA', marginTop: 1 },
  postText:         { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#222', lineHeight: 23, marginBottom: 12 },
  postImage:        { width: '100%', height: 220, borderRadius: 14, marginBottom: 12 },
  postActions:      { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount:      { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: '#999' },
});
