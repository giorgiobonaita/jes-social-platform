import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const JES_OFFICIAL_USERNAME = 'jes_official';

const GRADIENTS: [string, string][] = [
  ['#F07B1D', '#FF9A3D'],
  ['#E74C3C', '#FF7675'],
  ['#9B59B6', '#C39BD3'],
  ['#2980B9', '#74B9FF'],
  ['#27AE60', '#55EFC4'],
  ['#E67E22', '#FDCB6E'],
  ['#16A085', '#00CEC9'],
  ['#8E44AD', '#A29BFE'],
  ['#2C3E50', '#636E72'],
  ['#D35400', '#E17055'],
  ['#C0392B', '#FF7675'],
  ['#1ABC9C', '#00B894'],
  ['#3498DB', '#74B9FF'],
  ['#F39C12', '#FDCB6E'],
  ['#7F8C8D', '#B2BEC3'],
];

function seedToIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % GRADIENTS.length;
}

interface Props {
  uri: string | null | undefined;
  size: number;
  seed?: string;
  borderRadius?: number;
  style?: object;
}

export default function AvatarImg({ uri, size, seed, borderRadius, style }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const r = borderRadius ?? size / 2;
  const shapeStyle = { width: size, height: size, borderRadius: r };

  const validUri = uri && uri.trim() !== '';

  if (validUri && !imgFailed) {
    return (
      <Image
        source={{ uri }}
        style={[shapeStyle, style] as any}
        resizeMode="cover"
        onError={() => setImgFailed(true)}
      />
    );
  }

  if (seed === JES_OFFICIAL_USERNAME) {
    return (
      <LinearGradient
        colors={['#F07B1D', '#FF9A3D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[shapeStyle, { justifyContent: 'center', alignItems: 'center' }, style] as any}
      >
        <Ionicons name="shield-checkmark" size={Math.round(size * 0.55)} color="rgba(255,255,255,0.95)" />
      </LinearGradient>
    );
  }

  const idx = seed ? seedToIndex(seed) : 14;
  const [color1, color2] = GRADIENTS[idx];
  const initial = seed ? seed.trim().charAt(0).toUpperCase() : '';
  const fontSize = Math.round(size * 0.40);

  return (
    <LinearGradient
      colors={[color1, color2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[shapeStyle, { justifyContent: 'center', alignItems: 'center' }, style] as any}
    >
      {initial ? (
        <Text style={{
          fontSize,
          color: 'rgba(255,255,255,0.95)',
          fontFamily: 'PlusJakartaSans_700Bold',
          lineHeight: fontSize * 1.2,
          includeFontPadding: false,
        }}>
          {initial}
        </Text>
      ) : (
        <Ionicons name="person" size={Math.round(size * 0.55)} color="rgba(255,255,255,0.7)" />
      )}
    </LinearGradient>
  );
}
