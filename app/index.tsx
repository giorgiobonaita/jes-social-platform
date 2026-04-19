import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

function AnimatedButton({
  style,
  textStyle,
  label,
  onPress,
}: {
  style: object;
  textStyle: object;
  label: string;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
        <Text style={textStyle}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [init, setInit] = useState(false);

  useEffect(() => {
    // Show UI only after a short delay so that _layout.tsx check resolves if logged in
    const t = setTimeout(() => setInit(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (!init) return <View style={styles.container} />; // Schermata vuota anti-flash

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logo}>JES</Text>
        </View>
        <Text style={styles.subtitle}>IL SOCIAL DELLE EMOZIONI</Text>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 32 }]}>
        <AnimatedButton
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
          label="Registrati"
          onPress={() => router.push('/email-signup')}
        />
        <AnimatedButton
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
          label="Accedi"
          onPress={() => router.push('/email-login')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginRight: 12,
    marginBottom: 16,
  },
  logo: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 72,
    letterSpacing: -1,
    color: '#F07B1D',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    letterSpacing: 4,
    color: '#888888',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#F07B1D',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
