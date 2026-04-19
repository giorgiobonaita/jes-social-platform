import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // ms per storia

export interface StoryItem {
  id: string;
  imageUrl: string;
  timeAgo: string;
}

export interface UserStoryGroup {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  stories: StoryItem[];
}

// Legacy export so other files that import Story still compile
export interface Story {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  imageUrl: string;
  timeAgo: string;
}

interface StoryViewerProps {
  groups: UserStoryGroup[];
  initialGroupIndex: number;
  visible: boolean;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
  currentUserId?: string | null;
}

export default function StoryViewer({ groups, initialGroupIndex, visible, onClose, onUserPress, currentUserId }: StoryViewerProps) {
  const [groupIndex, setGroupIndex]   = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex]   = useState(0);
  const [isLiked, setIsLiked]         = useState(false);
  const isPausedRef = useRef(false);

  const progress     = useSharedValue(0);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef   = useRef<number>(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // ── Timer helpers ─────────────────────────────────────────────────────────
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

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => {
    elapsedRef.current = 0;
    progress.value = 0;
    if (storyIndex < (currentGroup?.stories.length ?? 1) - 1) {
      setStoryIndex(i => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    elapsedRef.current = 0;
    progress.value = 0;
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex(g => g - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    } else {
      startProgress(0);
    }
  };

  // ── Restart timer whenever story or visibility changes ─────────────────────
  useEffect(() => {
    if (visible && currentStory) {
      elapsedRef.current = 0;
      setIsLiked(false);
      startProgress(0);
      if (currentUserId && currentStory.id) {
        supabase.from('story_likes').select('id').eq('story_id', currentStory.id).eq('user_id', currentUserId).maybeSingle()
          .then(({ data }) => { if (data) setIsLiked(true); });
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      progress.value = 0;
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex, visible]);

  // Sync initial group when modal opens
  useEffect(() => {
    if (visible) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  const handlePressLeft  = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goPrev(); };
  const handlePressRight = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goNext(); };
  const handleLongPressIn  = () => { stopProgress(); };
  const handleLongPressOut = () => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    const pct = Math.min(elapsedRef.current / STORY_DURATION, 1);
    startProgress(pct);
  };
  // Called when any press is released — resumes only if story was paused
  const handlePressOut = () => { handleLongPressOut(); };

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!currentGroup || !currentStory) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Immagine storia */}
        <Image source={{ uri: currentStory.imageUrl }} style={styles.storyImage} resizeMode="cover" />

        {/* Gradienti */}
        <LinearGradient colors={['rgba(0,0,0,0.65)', 'transparent']} style={styles.topGradient} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomGradient} />

        {/* Aree tap sinistra / destra */}
        <View style={styles.tapAreas} pointerEvents="box-none">
          <TouchableWithoutFeedback onPress={handlePressLeft} onLongPress={handleLongPressIn} onPressOut={handlePressOut} delayLongPress={150}>
            <View style={styles.tapLeft} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={handlePressRight} onLongPress={handleLongPressIn} onPressOut={handlePressOut} delayLongPress={150}>
            <View style={styles.tapRight} />
          </TouchableWithoutFeedback>
        </View>

        {/* Header: barre di progresso + info utente */}
        <SafeAreaView style={styles.safeTop} pointerEvents="box-none">
          {/* Barre — una per ogni storia del gruppo corrente */}
          <View style={styles.progressBarsRow}>
            {currentGroup.stories.map((s, i) => (
              <View key={s.id} style={styles.progressTrack}>
                {i < storyIndex ? (
                  <View style={[styles.progressFill, { width: '100%' }]} />
                ) : i === storyIndex ? (
                  <Animated.View style={[styles.progressFill, progressBarStyle]} />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.userInfo}
              activeOpacity={0.75}
              onPress={() => {
                if (onUserPress && currentGroup.userId) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                  onUserPress(currentGroup.userId);
                }
              }}
            >
              <Image source={{ uri: currentGroup.avatarUrl }} style={styles.avatar} />
              <View style={styles.nameBlock}>
                <Text style={styles.username}>{currentGroup.name}</Text>
                <Text style={styles.timeAgo}>{currentStory.timeAgo}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Footer: solo like grande al centro */}
        <SafeAreaView style={styles.safeBottom} pointerEvents="box-none">
          <View style={styles.likeCenter}>
            <TouchableOpacity
              style={styles.likeBigBtn}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const newVal = !isLiked;
                setIsLiked(newVal);
                if (currentUserId && currentStory?.id) {
                  if (newVal) {
                    await supabase.from('story_likes').upsert({ story_id: currentStory.id, user_id: currentUserId }, { onConflict: 'story_id,user_id' });
                  } else {
                    await supabase.from('story_likes').delete().eq('story_id', currentStory.id).eq('user_id', currentUserId);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={52}
                color={isLiked ? '#FF3B5C' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const BAR_GAP = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  storyImage: { ...StyleSheet.absoluteFillObject, width, height },
  topGradient:    { position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, zIndex: 1 },

  tapAreas: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 3 },
  tapLeft:  { width: width * 0.35, height: '100%' },
  tapRight: { flex: 1, height: '100%' },

  safeTop: {
    zIndex: 4,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  progressBarsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 14,
    gap: BAR_GAP,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    marginRight: 10, backgroundColor: '#333',
  },
  nameBlock:  { justifyContent: 'center' },
  username:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  timeAgo:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeButton: { padding: 4 },

  safeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4 },
  likeCenter: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingTop: 16,
  },
  likeBigBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
