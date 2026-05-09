import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, Image, TouchableOpacity,
  Dimensions, SafeAreaView, StatusBar, Platform,
  TouchableWithoutFeedback, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import AvatarImg from './AvatarImg';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export interface StoryItem { id: string; imageUrl: string; timeAgo: string; }
export interface UserStoryGroup { userId: string; username: string; name: string; avatarUrl: string | null; stories: StoryItem[]; }
export interface Story { id: string; username: string; name: string; avatarUrl: string; imageUrl: string; timeAgo: string; }

interface Viewer { id: string; username: string; avatarUrl: string | null; }

interface StoryViewerProps {
  groups: UserStoryGroup[];
  initialGroupIndex: number;
  visible: boolean;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onStoryDeleted?: (storyId: string) => void;
}

export default function StoryViewer({ groups, initialGroupIndex, visible, onClose, onUserPress, currentUserId, isAdmin, onStoryDeleted }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isLiked, setIsLiked]       = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [showPanel, setShowPanel]   = useState(false);
  const [panelTab, setPanelTab]     = useState<'views' | 'likes'>('views');
  const [viewers, setViewers]       = useState<Viewer[]>([]);
  const [likers, setLikers]         = useState<Viewer[]>([]);

  const isPausedRef    = useRef(false);
  const progress       = useSharedValue(0);
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef   = useRef<number>(0);
  const elapsedRef     = useRef<number>(0);
  const viewTrackedRef = useRef<string | null>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwner      = currentGroup?.userId === currentUserId;
  const canSeeStats  = isOwner || isAdmin;

  const startProgress = (fromPct = 0) => {
    isPausedRef.current = false;
    const remaining = STORY_DURATION * (1 - fromPct);
    progress.value = fromPct;
    progress.value = withTiming(1, { duration: remaining });
    startTimeRef.current = Date.now() - fromPct * STORY_DURATION;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(goNext, remaining);
  };

  const stopProgress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    elapsedRef.current = Date.now() - startTimeRef.current;
    progress.value = Math.min(elapsedRef.current / STORY_DURATION, 1);
    isPausedRef.current = true;
  };

  const goNext = useCallback(() => {
    elapsedRef.current = 0; progress.value = 0; setShowPanel(false);
    if (storyIndex < (currentGroup?.stories.length ?? 1) - 1) {
      setStoryIndex(i => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1); setStoryIndex(0);
    } else { onClose(); }
  }, [storyIndex, groupIndex, currentGroup, groups, onClose]);

  const goPrev = useCallback(() => {
    elapsedRef.current = 0; progress.value = 0; setShowPanel(false);
    if (storyIndex > 0) { setStoryIndex(i => i - 1); }
    else if (groupIndex > 0) { setGroupIndex(g => g - 1); setStoryIndex(groups[groupIndex - 1].stories.length - 1); }
    else { startProgress(0); }
  }, [storyIndex, groupIndex, groups]);

  useEffect(() => {
    if (!visible || !currentStory) {
      if (timerRef.current) clearTimeout(timerRef.current);
      progress.value = 0; return;
    }
    elapsedRef.current = 0; setIsLiked(false); setShowPanel(false);
    startProgress(0);

    // Track view
    if (currentUserId && viewTrackedRef.current !== currentStory.id) {
      viewTrackedRef.current = currentStory.id;
      supabase.from('story_views').upsert({ story_id: currentStory.id, user_id: currentUserId }, { onConflict: 'story_id,user_id' }).then(() => {});
    }

    // Like state
    if (currentUserId) {
      supabase.from('story_likes').select('id').eq('story_id', currentStory.id).eq('user_id', currentUserId).maybeSingle()
        .then(({ data }) => { if (data) setIsLiked(true); });
    }

    // Counts for owner/admin
    if (canSeeStats) {
      supabase.from('story_views').select('id', { count: 'exact', head: true }).eq('story_id', currentStory.id)
        .then(({ count }) => setViewsCount(count || 0));
      supabase.from('story_likes').select('id', { count: 'exact', head: true }).eq('story_id', currentStory.id)
        .then(({ count }) => setLikesCount(count || 0));
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex, visible]);

  useEffect(() => {
    if (visible) { setGroupIndex(initialGroupIndex); setStoryIndex(0); }
  }, [visible, initialGroupIndex]);

  const openPanel = async (tab: 'views' | 'likes') => {
    if (!currentStory?.id) return;
    setPanelTab(tab); setShowPanel(true); stopProgress();
    if (tab === 'views') {
      const { data } = await supabase.from('story_views').select('user_id, users(id, username, avatar_url)').eq('story_id', currentStory.id).order('created_at', { ascending: false }).limit(100);
      setViewers((data || []).map((r: any) => ({ id: r.users?.id || r.user_id, username: r.users?.username || 'utente', avatarUrl: r.users?.avatar_url || null })));
    } else {
      const { data } = await supabase.from('story_likes').select('user_id, users(id, username, avatar_url)').eq('story_id', currentStory.id).order('created_at', { ascending: false }).limit(100);
      setLikers((data || []).map((r: any) => ({ id: r.users?.id || r.user_id, username: r.users?.username || 'utente', avatarUrl: r.users?.avatar_url || null })));
    }
  };

  const closePanel = () => {
    setShowPanel(false);
    const pct = Math.min(elapsedRef.current / STORY_DURATION, 1);
    startProgress(pct);
  };

  const handleDelete = () => {
    Alert.alert('Elimina storia', 'Sei sicuro di voler eliminare questa storia?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => {
        const deletedId = currentStory!.id;
        await supabase.from('stories').delete().eq('id', deletedId);
        onStoryDeleted?.(deletedId);
        if (currentGroup.stories.length === 1) { onClose(); return; }
        if (storyIndex < currentGroup.stories.length - 1) setStoryIndex(i => i + 1);
        else setStoryIndex(i => i - 1);
      }},
    ]);
  };

  const handlePressLeft  = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goPrev(); };
  const handlePressRight = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goNext(); };
  const handleLongPressIn  = () => { stopProgress(); };
  const handlePressOut     = () => {
    if (!isPausedRef.current || showPanel) return;
    isPausedRef.current = false;
    const pct = Math.min(elapsedRef.current / STORY_DURATION, 1);
    startProgress(pct);
  };

  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (!currentGroup || !currentStory) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Image source={{ uri: currentStory.imageUrl }} style={s.storyImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.65)', 'transparent']} style={s.topGradient} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={s.bottomGradient} />

        {/* Tap areas */}
        {!showPanel && (
          <View style={s.tapAreas} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={handlePressLeft} onLongPress={handleLongPressIn} onPressOut={handlePressOut} delayLongPress={150}>
              <View style={s.tapLeft} />
            </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={handlePressRight} onLongPress={handleLongPressIn} onPressOut={handlePressOut} delayLongPress={150}>
              <View style={s.tapRight} />
            </TouchableWithoutFeedback>
          </View>
        )}

        {/* Header */}
        <SafeAreaView style={s.safeTop} pointerEvents="box-none">
          <View style={s.progressBarsRow}>
            {currentGroup.stories.map((st, i) => (
              <View key={st.id} style={s.progressTrack}>
                {i < storyIndex ? <View style={[s.progressFill, { width: '100%' }]} />
                  : i === storyIndex ? <Animated.View style={[s.progressFill, progressBarStyle]} />
                  : null}
              </View>
            ))}
          </View>
          <View style={s.header} pointerEvents="box-none">
            <TouchableOpacity style={s.userInfo} activeOpacity={0.75} onPress={() => {
              if (onUserPress && currentGroup.userId) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); onUserPress(currentGroup.userId); }
            }}>
              <Image source={{ uri: currentGroup.avatarUrl || undefined }} style={s.avatar} />
              <View style={s.nameBlock}>
                <Text style={s.username}>{currentGroup.name}</Text>
                <Text style={s.timeAgo}>{currentStory.timeAgo}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {(isOwner || isAdmin) && (
                <TouchableOpacity onPress={handleDelete} style={s.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={s.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Footer */}
        <SafeAreaView style={s.safeBottom} pointerEvents="box-none">
          <View style={s.footer}>
            {/* Stats per proprietario/admin */}
            {canSeeStats ? (
              <View style={s.statsRow}>
                <TouchableOpacity style={s.statBtn} onPress={() => openPanel('views')}>
                  <Ionicons name="eye-outline" size={18} color="white" />
                  <Text style={s.statText}>{viewsCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.statBtn} onPress={() => openPanel('likes')}>
                  <Ionicons name="heart" size={18} color="#FF3B5C" />
                  <Text style={s.statText}>{likesCount}</Text>
                </TouchableOpacity>
              </View>
            ) : <View />}

            {/* Like button */}
            <TouchableOpacity style={s.likeBigBtn} activeOpacity={0.8} onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const newVal = !isLiked;
              setIsLiked(newVal);
              setLikesCount(p => newVal ? p + 1 : Math.max(0, p - 1));
              if (currentUserId && currentStory?.id) {
                if (newVal) await supabase.from('story_likes').upsert({ story_id: currentStory.id, user_id: currentUserId }, { onConflict: 'story_id,user_id' });
                else await supabase.from('story_likes').delete().eq('story_id', currentStory.id).eq('user_id', currentUserId);
              }
            }}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={52} color={isLiked ? '#FF3B5C' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Panel visto da / like */}
        {showPanel && (
          <View style={s.panel}>
            <View style={s.panelHandle} />
            {/* Tabs */}
            <View style={s.panelTabs}>
              <TouchableOpacity style={[s.panelTab, panelTab === 'views' && s.panelTabActive]} onPress={() => openPanel('views')}>
                <Ionicons name="eye-outline" size={16} color={panelTab === 'views' ? 'white' : '#888'} />
                <Text style={[s.panelTabText, panelTab === 'views' && s.panelTabTextActive]}>{viewsCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.panelTab, panelTab === 'likes' && s.panelTabActive]} onPress={() => openPanel('likes')}>
                <Ionicons name="heart" size={16} color={panelTab === 'likes' ? '#FF3B5C' : '#888'} />
                <Text style={[s.panelTabText, panelTab === 'likes' && s.panelTabTextActive]}>{likesCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closePanel} style={{ padding: 8 }}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
              {(panelTab === 'views' ? viewers : likers).length === 0 ? (
                <Text style={s.emptyText}>{panelTab === 'views' ? 'Nessuna visualizzazione' : 'Nessun like'}</Text>
              ) : (panelTab === 'views' ? viewers : likers).map(u => (
                <View key={u.id} style={s.panelRow}>
                  <AvatarImg uri={u.avatarUrl} size={38} seed={u.username} borderRadius={19} />
                  <Text style={s.panelRowName}>@{u.username}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const BAR_GAP = 3;
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  storyImage:     { ...StyleSheet.absoluteFillObject, width, height },
  topGradient:    { position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 1 },
  tapAreas:       { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 3 },
  tapLeft:        { width: width * 0.35, height: '100%' },
  tapRight:       { flex: 1, height: '100%' },
  safeTop:        { zIndex: 4, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  progressBarsRow:{ flexDirection: 'row', paddingHorizontal: 10, paddingTop: 14, gap: BAR_GAP },
  progressTrack:  { flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  userInfo:       { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar:         { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', marginRight: 10, backgroundColor: '#333' },
  nameBlock:      { justifyContent: 'center' },
  username:       { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFF' },
  timeAgo:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeButton:    { padding: 4 },
  deleteBtn:      { padding: 4, backgroundColor: 'rgba(255,59,48,0.2)', borderRadius: 8 },
  safeBottom:     { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 },
  footer:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 48 : 32, paddingTop: 16 },
  statsRow:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statText:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: 'white' },
  likeBigBtn:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  // Panel
  panel:          { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.55, backgroundColor: 'rgba(18,18,18,0.98)', borderRadius: 20, zIndex: 10 },
  panelHandle:    { width: 36, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  panelTabs:      { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2a2a2a', marginTop: 10 },
  panelTab:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  panelTabActive: { borderBottomColor: 'white' },
  panelTabText:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#888' },
  panelTabTextActive: { color: 'white' },
  panelRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  panelRowName:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: 'white' },
  emptyText:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#666', textAlign: 'center', marginTop: 32 },
});
