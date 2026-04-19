import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Pressable, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const ORANGE = '#F07B1D';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  onStory: () => void;
  onPoll: () => void;
}

const OPTIONS = [
  {
    key: 'post',
    label: 'Post',
    sub: 'Condividi una foto o più',
    icon: 'image-outline',
    color: '#5B6AF5',
    bg: '#5B6AF518',
  },
  {
    key: 'story',
    label: 'Storia',
    sub: 'Scompare dopo 24 ore',
    icon: 'play-circle-outline',
    color: ORANGE,
    bg: ORANGE + '18',
  },
  {
    key: 'poll',
    label: 'Sondaggio',
    sub: 'Chiedi l\'opinione dei tuoi follower',
    icon: 'bar-chart-outline',
    color: '#34C759',
    bg: '#34C75918',
  },
] as const;

export default function CreateMenuModal({ visible, onClose, onPost, onStory, onPoll }: Props) {
  const slideY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.8 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handlers: Record<string, () => void> = {
    post:  () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); setTimeout(onPost, 200); },
    story: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); setTimeout(onStory, 200); },
    poll:  () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClose(); setTimeout(onPoll, 200); },
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>Cosa vuoi creare?</Text>

          {/* Opzioni */}
          <View style={styles.optionsList}>
            {OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={styles.optionRow}
                onPress={handlers[opt.key]}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionSub}>{opt.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Annulla */}
          <TouchableOpacity style={styles.cancelRow} onPress={onClose} activeOpacity={0.65}>
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  handle:        { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 14, marginBottom: 22 },
  sheetTitle:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: '#111', paddingHorizontal: 22, marginBottom: 8 },

  optionsList:   { paddingHorizontal: 16, gap: 4 },
  optionRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10, gap: 16, borderRadius: 18 },
  optionIcon:    { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  optionText:    { flex: 1, gap: 2 },
  optionLabel:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#111' },
  optionSub:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#AAA' },

  cancelRow:     { marginTop: 16, marginHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', alignItems: 'center' },
  cancelText:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, color: '#999' },
});
