import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';
const GREY   = '#E0E0E0';

const CARD_W  = 70;
const CARD_H  = 88;
const RADIUS  = 14;   // leggermente arrotondato

interface StoryRingProps {
  id: string;
  username: string;
  avatarUrl: string | null;
  isCustom?: boolean;
  hasUnwatched?: boolean;
  onPress: () => void;
}

export default function StoryRing({
  username,
  avatarUrl,
  isCustom = false,
  hasUnwatched = false,
  onPress,
}: StoryRingProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const ringColor = (isCustom || hasUnwatched) ? ORANGE : GREY;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handlePress}>
      {/* Bordo esterno arancione/grigio + gap bianco (padding 2px) */}
      <View style={[styles.ring, { borderColor: ringColor }]}>
        <View style={styles.card}>
          <AvatarImg
            uri={avatarUrl}
            size={CARD_W}
            seed={username}
            borderRadius={RADIUS}
            style={styles.img}
          />
          {isCustom && (
            <View style={styles.addBadgeOverlay}>
              <View style={styles.addBadge}>
                <Ionicons name="add" size={22} color="#fff" />
              </View>
            </View>
          )}
        </View>
      </View>
      {/* Nome fuori */}
      <Text style={styles.name} numberOfLines={1}>
        {isCustom ? 'La tua storia' : username}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 10,
    width: CARD_W + 4,
  },
  ring: {
    width: CARD_W + 4,
    height: CARD_H + 4,
    borderRadius: RADIUS + 2,
    borderWidth: 2,
    padding: 2,
    backgroundColor: '#fff',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  name: {
    marginTop: 5,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: '#222',
    textAlign: 'center',
    width: CARD_W + 4,
    letterSpacing: 0.1,
  },
  addBadgeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  addBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ORANGE,
    borderWidth: 2.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
