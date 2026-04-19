import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, Modal, Pressable,
  TouchableOpacity, Dimensions, Share, FlatList, Linking, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AvatarImg from './AvatarImg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { supabase, JES_OFFICIAL_USERNAME } from '../lib/supabase';

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';

const LINK_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|it|net|org|io|co|uk|de|fr|es|eu|app|dev|me|info|biz|edu)(?:\/[^\s]*)?)/g;

function parseLinks(text: string): Array<{ text: string; isUrl: boolean }> {
  const result: Array<{ text: string; isUrl: boolean }> = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) result.push({ text: text.slice(lastIndex, match.index), isUrl: false });
    result.push({ text: match[0], isUrl: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), isUrl: false });
  return result;
}

interface PostCardProps {
  id: string;
  userId?: string | null;
  currentUserId?: string | null;
  isAdmin?: boolean;
  isLiked?: boolean;
  isFollowingAuthor?: boolean;
  onFollowAuthor?: (userId: string) => void;
  author: {
    name: string;
    username: string;
    avatarUrl: string | null;
    discipline: string;
    role?: string | null;
  };
  imageUrl?: string;
  imageUrls?: string[];
  aspectRatio?: number;
  likesCount: number;
  commentsCount: number;
  caption: string;
  timeAgo: string;
  tags: string[];
  groupName?: string;
  currentUserAvatar?: string | null;
  onImagePress?: (imageUrl: string) => void;
  onCommentPress?: () => void;
  onDelete?: () => void;
  onUserPress?: (userId: string) => void;
}

export default function PostCard({
  id,
  userId,
  currentUserId,
  isAdmin = false,
  isLiked: initialIsLiked = false,
  isFollowingAuthor: initialIsFollowingAuthor = false,
  onFollowAuthor,
  author,
  imageUrl,
  imageUrls,
  aspectRatio = 1,
  likesCount: initialLikes,
  commentsCount,
  caption,
  timeAgo,
  tags,
  groupName,
  currentUserAvatar = null,
  onImagePress,
  onCommentPress,
  onDelete,
  onUserPress,
}: PostCardProps) {
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(initialIsFollowingAuthor);
  useEffect(() => { setIsFollowingAuthor(initialIsFollowingAuthor); }, [initialIsFollowingAuthor]);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);

  // Sincronizza quando il feed si aggiorna via realtime
  useEffect(() => { setIsLiked(initialIsLiked); }, [initialIsLiked]);
  useEffect(() => { setLikesCount(initialLikes); }, [initialLikes]);
  const [isSaved, setIsSaved] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirm, setConfirm] = useState<'delete' | 'ban' | 'report' | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [editCaption, setEditCaption] = useState(caption);
  const [editSaving, setEditSaving] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<string>('other');
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const isOwn = !!(userId && currentUserId && userId === currentUserId);

  useEffect(() => {
    if (!currentUserId) return;
    supabase.from('saves').select('id').eq('post_id', id).eq('user_id', currentUserId).maybeSingle()
      .then(({ data }) => { if (data) setIsSaved(true); });
  }, [id, currentUserId]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('comments')
        .select('id, text, user_id, users(username)')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
        .limit(4);
      if (!data) return;
      setPreviewComments(data.map((c: any) => ({
        id: c.id,
        text: c.text || '',
        username: (c.users as any)?.username || 'utente',
      })));
    })();
  }, [id]);
  const [expanded, setExpanded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [previewComments, setPreviewComments] = useState<{ id: string; username: string; text: string }[]>([]);

  // Normalise: prefer imageUrls array, fallback to legacy imageUrl
  const photos = imageUrls && imageUrls.length > 0
    ? imageUrls
    : imageUrl ? [imageUrl] : [];

  const heartScale   = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const sendLikeNotification = useCallback((senderId: string) => {
    if (userId && userId !== senderId) {
      supabase.from('notifications').insert({
        user_id:  userId,
        actor_id: senderId,
        type:     'like',
        post_id:  id,
      }).then(() => {});
    }
  }, [userId, id]);

  const triggerDoubleTapLike = useCallback(() => {
    if (!isLiked && currentUserId) {
      setIsLiked(true);
      setLikesCount(p => p + 1);
      supabase.from('likes').insert({ post_id: id, user_id: currentUserId })
        .then(({ error }) => { if (error) { setIsLiked(false); setLikesCount(p => p - 1); } });
      sendLikeNotification(currentUserId);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isLiked, currentUserId, id, sendLikeNotification]);

  const currentPhoto = photos[carouselIndex] ?? photos[0] ?? '';

  const doubleTapGesture = useMemo(() =>
    Gesture.Tap().numberOfTaps(2).onEnd(() => {
      'worklet';
      heartScale.value = withSequence(
        withSpring(1.4, { damping: 10, stiffness: 200 }),
        withTiming(1.0, { duration: 100 }),
        withTiming(0,   { duration: 350 })
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 470 }),
        withTiming(0, { duration: 200 })
      );
      runOnJS(triggerDoubleTapLike)();
    }),
  [triggerDoubleTapLike]);

  const singleTapGesture = useMemo(() =>
    Gesture.Tap().numberOfTaps(1).onEnd(() => {
      'worklet';
      if (onImagePress && currentPhoto) runOnJS(onImagePress)(currentPhoto);
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [onImagePress, currentPhoto]);

  const composed = useMemo(
    () => Gesture.Exclusive(doubleTapGesture, singleTapGesture),
    [doubleTapGesture, singleTapGesture]
  );

  const toggleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentUserId) return;
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(p => p - 1);
      supabase.from('likes').delete().eq('post_id', id).eq('user_id', currentUserId)
        .then(({ error }) => { if (error) { setIsLiked(true); setLikesCount(p => p + 1); } });
    } else {
      setIsLiked(true);
      setLikesCount(p => p + 1);
      supabase.from('likes').insert({ post_id: id, user_id: currentUserId })
        .then(({ error }) => { if (error) { setIsLiked(false); setLikesCount(p => p - 1); } });
      sendLikeNotification(currentUserId);
    }
  };

  const toggleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentUserId) return;
    if (isSaved) {
      setIsSaved(false);
      supabase.from('saves').delete().eq('post_id', id).eq('user_id', currentUserId)
        .then(({ error }) => { if (error) setIsSaved(true); });
    } else {
      setIsSaved(true);
      supabase.from('saves').insert({ post_id: id, user_id: currentUserId })
        .then(({ error }) => { if (error) setIsSaved(false); });
    }
  };

  const imageHeight = Math.min(SW / aspectRatio, 520);
  const isCarousel = photos.length > 1;

  const handleFollow = async () => {
    if (!currentUserId || !userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowingAuthor(true);
    const { error } = await supabase.from('follows').insert({
      follower_id: currentUserId,
      following_id: userId,
    });
    if (error) {
      setIsFollowingAuthor(false);
    } else {
      onFollowAuthor?.(userId);
    }
  };

  return (
    <>
    <View style={s.post}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.avatarRing}
          activeOpacity={0.75}
          onPress={() => { if (userId && onUserPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUserPress(userId); } }}
        >
          <AvatarImg uri={author.avatarUrl} size={28} seed={author.username} style={s.avatar} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.headerMeta}
          activeOpacity={0.75}
          onPress={() => { if (userId && onUserPress) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUserPress(userId); } }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.username}>
              {author.username}{groupName ? ` — ${groupName}` : ''}
            </Text>
            {author.username === JES_OFFICIAL_USERNAME && (
              <Ionicons name="checkmark-circle" size={14} color={ORANGE} />
            )}
          </View>
          <Text style={s.discipline}>{author.discipline}</Text>
        </TouchableOpacity>
        <Text style={s.timeAgo}>{timeAgo}</Text>
        {!isOwn && !isFollowingAuthor && !!currentUserId && (
          <TouchableOpacity
            style={s.seguiBtn}
            onPress={handleFollow}
            activeOpacity={0.75}
          >
            <Text style={s.seguiBtnText}>Segui</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.moreBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMenuVisible(true);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {/* ── IMMAGINE / CAROSELLO ── */}
      {photos.length > 0 ? (
        isCarousel ? (
          <View style={[s.imageWrap, { height: imageHeight }]}>
            <FlatList
              data={photos}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
                setCarouselIndex(idx);
              }}
              renderItem={({ item: photo }) => (
                <GestureDetector gesture={composed}>
                  <View style={[s.imageWrap, { height: imageHeight }]}>
                    <Image source={{ uri: photo }} style={s.image} resizeMode="cover" />
                    <Animated.View style={[s.heartOverlay, heartAnimStyle]} pointerEvents="none">
                      <Ionicons name="heart" size={100} color="rgba(255,255,255,0.9)" />
                    </Animated.View>
                  </View>
                </GestureDetector>
              )}
            />
            {/* Dot indicators */}
            <View style={s.dotRow} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={[s.dot, i === carouselIndex && s.dotActive]} />
              ))}
            </View>
          </View>
        ) : (
          <GestureDetector gesture={composed}>
            <View style={[s.imageWrap, { height: imageHeight }]}>
              <Image source={{ uri: photos[0] }} style={s.image} resizeMode="cover" />
              <Animated.View style={[s.heartOverlay, heartAnimStyle]} pointerEvents="none">
                <Ionicons name="heart" size={100} color="rgba(255,255,255,0.9)" />
              </Animated.View>
            </View>
          </GestureDetector>
        )
      ) : null}

      {/* ── AZIONI ── */}
      <View style={s.actions}>
        <View style={s.actionsLeft}>
          <View style={s.likeGroup}>
            <TouchableOpacity onPress={toggleLike} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? ORANGE : '#111'} />
            </TouchableOpacity>
            {likesCount > 0 && (
              <Text style={s.inlineLikeCount}>{likesCount.toLocaleString('it-IT')}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onCommentPress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chatbubble-outline" size={26} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const shareMsg = caption
                ? `${caption}\n\n🔗 jes://post/${id}`
                : `Guarda questo post su JES!\n\n🔗 jes://post/${id}`;
              Share.share({ message: shareMsg, url: `jes://post/${id}` })
                .catch(() => {});
            }}
          >
            <Ionicons name="arrow-redo-outline" size={26} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={s.actionsRight}>
          {!isOwn && (
            <TouchableOpacity
              onPress={() => {
                setReportText('');
                setReportType('other');
                setReportSent(false);
                setReportVisible(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="flag-outline" size={23} color="#AAAAAA" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleSave} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={26} color={isSaved ? ORANGE : '#111'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CONTENUTO TESTUALE ── */}
      <View style={s.textBlock}>

        {/* Caption con username in bold e link cliccabili */}
        <TouchableOpacity onPress={() => setExpanded(p => !p)} activeOpacity={0.9}>
          <Text style={s.caption} numberOfLines={expanded ? undefined : 2}>
            <Text style={s.captionUser}>{author.username} </Text>
            {parseLinks(caption).map((part, i) =>
              part.isUrl ? (
                <Text key={i} style={s.captionLink} onPress={(e) => {
                  e.stopPropagation();
                  const url = part.text.startsWith('http') ? part.text : `https://${part.text}`;
                  Linking.openURL(url).catch(() => {});
                }}>{part.text}</Text>
              ) : (
                <Text key={i}>{part.text}</Text>
              )
            )}
          </Text>
          {!expanded && caption.length > 80 && (
            <Text style={s.more}>altro</Text>
          )}
        </TouchableOpacity>

        {/* Tags come hashtag */}
        {tags && tags.length > 0 && (
          <Text style={s.hashtags}>
            {tags.map(t => `#${t}`).join('  ')}
          </Text>
        )}

        {/* Preview commenti (max 4) */}
        {previewComments.length > 0 && (
          <View style={s.commentsPreview}>
            {previewComments.map(c => (
              <Text key={c.id} style={s.commentLine} numberOfLines={2}>
                <Text style={s.commentUsername}>{c.username} </Text>
                {c.text}
              </Text>
            ))}
          </View>
        )}

        {/* Guarda tutti */}
        {commentsCount > 4 && (
          <TouchableOpacity onPress={onCommentPress} activeOpacity={0.7}>
            <Text style={s.viewComments}>Guarda tutti i {commentsCount} commenti</Text>
          </TouchableOpacity>
        )}
        {commentsCount > 0 && commentsCount <= 4 && (
          <TouchableOpacity onPress={onCommentPress} activeOpacity={0.7}>
            <Text style={s.viewComments}>Visualizza i commenti</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── BARRA COMMENTO RAPIDO ── */}
      <TouchableOpacity style={s.quickCommentBar} onPress={onCommentPress} activeOpacity={0.85}>
        <AvatarImg uri={currentUserAvatar} size={26} style={s.quickCommentAvatar} />
        <View style={s.quickCommentInput}>
          <Text style={s.quickCommentPlaceholder}>Aggiungi un commento...</Text>
        </View>
      </TouchableOpacity>

    </View>

    {/* ── MENU 3 PUNTINI (JES-style bottom sheet) ── */}
    <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
      <Pressable style={ms.overlay} onPress={() => setMenuVisible(false)} />
      <View style={ms.sheet}>
        <View style={ms.handle} />
        <Text style={ms.sheetTitle}>{author.username}</Text>

        {isOwn && (
          <TouchableOpacity style={ms.option} onPress={() => { setMenuVisible(false); setEditCaption(caption); setTimeout(() => setEditVisible(true), 300); }}>
            <Ionicons name="create-outline" size={20} color="#111" />
            <Text style={ms.optionText}>Modifica post</Text>
          </TouchableOpacity>
        )}

        {(isOwn || isAdmin) && (
          <TouchableOpacity style={ms.option} onPress={() => { setMenuVisible(false); setTimeout(() => setConfirm('delete'), 300); }}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[ms.optionText, ms.optionDanger]}>
              {isAdmin && !isOwn ? 'Elimina post (Admin)' : 'Elimina post'}
            </Text>
          </TouchableOpacity>
        )}

        {isAdmin && !isOwn && userId && (
          <TouchableOpacity style={ms.option} onPress={() => { setMenuVisible(false); setTimeout(() => setConfirm('ban'), 300); }}>
            <Ionicons name="ban-outline" size={20} color="#FF3B30" />
            <Text style={[ms.optionText, ms.optionDanger]}>Banna utente (Admin)</Text>
          </TouchableOpacity>
        )}

        <View style={ms.divider} />

        <TouchableOpacity style={ms.option} onPress={() => setMenuVisible(false)}>
          <Ionicons name="thumbs-down-outline" size={20} color="#555" />
          <Text style={ms.optionText}>Non mi interessa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={ms.option} onPress={() => {
          setMenuVisible(false);
          setReportText('');
          setReportType('other');
          setReportSent(false);
          setTimeout(() => setReportVisible(true), 300);
        }}>
          <Ionicons name="flag-outline" size={20} color="#FF3B30" />
          <Text style={[ms.optionText, ms.optionDanger]}>Segnala</Text>
        </TouchableOpacity>

        <TouchableOpacity style={ms.cancelOption} onPress={() => setMenuVisible(false)}>
          <Text style={ms.cancelText}>Annulla</Text>
        </TouchableOpacity>
      </View>
    </Modal>

    {/* ── CONFERMA / FEEDBACK (JES-style card centrata) ── */}
    <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
      <Pressable style={ms.overlay} onPress={() => setConfirm(null)} />
      <View style={ms.confirmCard}>
        {confirm === 'delete' && (
          <>
            <Ionicons name="trash-outline" size={36} color="#FF3B30" />
            <Text style={ms.confirmTitle}>Elimina post</Text>
            <Text style={ms.confirmMsg}>Sei sicuro di voler eliminare questo post? L'azione è irreversibile.</Text>
            <TouchableOpacity style={ms.confirmBtnDanger} onPress={async () => {
              setConfirm(null);
              await supabase.from('posts').delete().eq('id', id);
              onDelete?.();
            }}>
              <Text style={ms.confirmBtnText}>Elimina</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ms.confirmBtnCancel} onPress={() => setConfirm(null)}>
              <Text style={ms.confirmBtnCancelText}>Annulla</Text>
            </TouchableOpacity>
          </>
        )}
        {confirm === 'ban' && (
          <>
            <Ionicons name="ban" size={36} color="#FF3B30" />
            <Text style={ms.confirmTitle}>Banna {author.username}</Text>
            <Text style={ms.confirmMsg}>L'utente non potrà più accedere all'app.</Text>
            <TouchableOpacity style={ms.confirmBtnDanger} onPress={async () => {
              setConfirm(null);
              if (userId) await supabase.from('users').update({ is_banned: true }).eq('id', userId);
            }}>
              <Text style={ms.confirmBtnText}>Banna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ms.confirmBtnCancel} onPress={() => setConfirm(null)}>
              <Text style={ms.confirmBtnCancelText}>Annulla</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>

    {/* ── MODIFICA POST ── */}
    <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
      <Pressable style={ms.overlay} onPress={() => setEditVisible(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={ms.editSheet}>
          <View style={ms.handle} />
          <View style={ms.editHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={ms.editCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={ms.editTitle}>Modifica post</Text>
            <TouchableOpacity
              onPress={async () => {
                if (editSaving) return;
                setEditSaving(true);
                const { error } = await supabase.from('posts').update({ caption: editCaption.trim() }).eq('id', id);
                setEditSaving(false);
                if (!error) {
                  setEditVisible(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            >
              {editSaving
                ? <ActivityIndicator size="small" color={ORANGE} />
                : <Text style={ms.editSave}>Salva</Text>
              }
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}>
            <TextInput
              style={ms.editInput}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Scrivi una didascalia..."
              placeholderTextColor="#AAAAAA"
              multiline
              autoFocus
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── SEGNALAZIONE ── */}
    <Modal visible={reportVisible} transparent animationType="slide" onRequestClose={() => setReportVisible(false)}>
      <Pressable style={ms.overlay} onPress={() => setReportVisible(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View style={ms.editSheet}>
          <View style={ms.handle} />
          {reportSent ? (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
              <Ionicons name="checkmark-circle" size={52} color="#34C759" />
              <Text style={ms.editTitle}>Segnalazione inviata</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 24 }}>
                Grazie. Il team JES esaminerà il contenuto.
              </Text>
              <TouchableOpacity onPress={() => setReportVisible(false)} style={[ms.confirmBtnOk, { marginTop: 8, marginHorizontal: 24 }]}>
                <Text style={ms.confirmBtnText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={ms.editHeader}>
                <TouchableOpacity onPress={() => setReportVisible(false)}>
                  <Text style={ms.editCancel}>Annulla</Text>
                </TouchableOpacity>
                <Text style={ms.editTitle}>Segnala post</Text>
                <TouchableOpacity onPress={async () => {
                  await supabase.from('reports').insert({
                    reporter_id:      currentUserId || null,
                    reported_user_id: userId || null,
                    post_id:          id,
                    type:             reportType,
                    description:      reportText.trim() || null,
                  });
                  setReportSent(true);
                }}>
                  <Text style={ms.editSave}>Invia</Text>
                </TouchableOpacity>
              </View>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 360 }}>
                {/* Tipo */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
                  {(['spam', 'offensive', 'harassment', 'fake', 'other'] as const).map(t => (
                    <TouchableOpacity key={t} onPress={() => setReportType(t)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: reportType === t ? ORANGE : '#CCC', alignItems: 'center', justifyContent: 'center' }}>
                        {reportType === t && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE }} />}
                      </View>
                      <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: '#111', textTransform: 'capitalize' }}>
                        {t === 'offensive' ? 'Contenuto offensivo' : t === 'harassment' ? 'Molestia' : t === 'spam' ? 'Spam' : t === 'fake' ? 'Informazioni false' : 'Altro'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={ms.editInput}
                  value={reportText}
                  onChangeText={setReportText}
                  placeholder="Descrivi il problema (opzionale)…"
                  placeholderTextColor="#AAAAAA"
                  multiline
                />
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>

    </>
  );
}

const ms = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 12 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 12 },
  sheetTitle:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#111', textAlign: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginHorizontal: 20 },
  option:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 16 },
  optionText:   { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, color: '#111', flex: 1 },
  optionDanger: { color: '#FF3B30' },
  divider:      { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginVertical: 4 },
  cancelOption: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  cancelText:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#111' },
  confirmCard:  { position: 'absolute', top: '30%', left: 32, right: 32, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  confirmTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#111', textAlign: 'center' },
  confirmMsg:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  confirmBtnDanger: { backgroundColor: '#FF3B30', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, marginTop: 6, width: '100%', alignItems: 'center' },
  confirmBtnOk:     { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, marginTop: 6, width: '100%', alignItems: 'center' },
  confirmBtnCancel: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  confirmBtnText:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },
  confirmBtnCancelText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#111' },

  /* Edit Post */
  editSheet:  { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 12 },
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  editTitle:  { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#111' },
  editCancel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#888' },
  editSave:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: ORANGE },
  editInput:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#111', padding: 20, minHeight: 120, textAlignVertical: 'top', lineHeight: 22 },
});

const s = StyleSheet.create({
  post: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: ORANGE,
    padding: 2,
    marginRight: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#EFEFEF',
  },
  headerMeta: {
    flex: 1,
  },
  username: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#111',
    letterSpacing: -0.1,
  },
  discipline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#AAAAAA',
  },
  timeAgo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#AAAAAA',
    marginRight: 10,
  },
  moreBtn: {
    paddingHorizontal: 4,
  },

  /* Immagine */
  imageWrap: {
    width: SW,
    backgroundColor: '#F4F4F4',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Azioni */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  /* Testo */
  textBlock: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 3,
  },
  likesText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#111',
    marginBottom: 2,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
  captionUser: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#111',
  },
  more: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#AAAAAA',
  },
  hashtags: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: ORANGE,
    marginTop: 4,
  },
  viewComments: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 3,
  },
  captionLink: {
    color: ORANGE,
    textDecorationLine: 'underline',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
  },
  commentsPreview: {
    marginTop: 4,
    gap: 3,
  },
  commentLine: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#111',
    lineHeight: 18,
  },
  commentUsername: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#111',
  },
  quickCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  quickCommentAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  quickCommentInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickCommentPlaceholder: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#AAAAAA',
  },

  /* Visual badge */
  visualBadge: {
    backgroundColor: ORANGE,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  visualBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.3,
  },

  /* Segui button */
  seguiBtn: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  seguiBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
    color: '#fff',
  },

  /* Like count inline */
  likeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inlineLikeCount: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#111',
  },
});
