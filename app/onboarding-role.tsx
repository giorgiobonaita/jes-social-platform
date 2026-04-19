import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const ROLES = [
  { id: 'user', title: 'Utente', description: "Esplora l'arte, scopri nuovi talenti e interagisci.", icon: 'compass' },
  { id: 'student', title: 'Studente / Insegnante', description: "Studia, insegna o condividi la tua passione per l'arte.", icon: 'school' },
  { id: 'hobby_artist', title: 'Artista emergente', description: "Crea arte nel tempo libero o sei alle prime armi.", icon: 'color-palette' },
  { id: 'pro_artist', title: 'Artista professionista', description: "L'arte è la tua professione e la tua carriera principale.", icon: 'brush' },
  { id: 'gallery', title: 'Gallerie & Società', description: "Promuovi e gestisci opere d'arte o artisti.", icon: 'storefront' },
];

function RoleCard({ role, selected, onPress }: { role: typeof ROLES[0]; selected: boolean; onPress: () => void }) {
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
      <Animated.View
        style={[
          styles.card,
          selected && styles.cardSelected,
          { opacity, transform: [{ scale }] },
        ]}
      >
        {selected && (
          <LinearGradient
            colors={['rgba(240, 123, 29, 0.08)', 'rgba(240, 123, 29, 0.02)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        <View style={styles.iconContainer}>
          {selected ? (
            <LinearGradient colors={['#F4924A', '#F07B1D']} style={styles.iconGradient}>
              <Ionicons name={role.icon as any} size={22} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.iconBgFallback}>
              <Ionicons name={`${role.icon}-outline` as any} size={22} color="#888888" />
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]} numberOfLines={1} ellipsizeMode="tail">
            {role.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2} ellipsizeMode="tail">
            {role.description}
          </Text>
        </View>

        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingRoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedId(id);
  };

  const handleContinue = async () => {
    if (!selectedId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (dbUser) {
          const selectedRole = ROLES.find(r => r.id === selectedId);
          await supabase.from('users')
            .update({ discipline: selectedRole?.title ?? '' })
            .eq('id', dbUser.id);
        }
      }
    } catch { /* non bloccare il flusso */ }
    router.push('/onboarding-friends');
  };

  const btnOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const onBtnPressIn = () => {
    if (!selectedId) return;
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const onBtnPressOut = () => {
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.header}>
        <Text style={styles.title}>Cosa ti rappresenta?</Text>
        <Text style={styles.subtitle}>
          Scegli il profilo che si{' '}
          <Text style={styles.subtitleAccent}>adatta meglio</Text>
          {' '}a te. Potrai comunque esplorare tutto.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
      >
        {ROLES.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            selected={selectedId === role.id}
            onPress={() => handleSelect(role.id)}
          />
        ))}
      </ScrollView>

      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPressIn={onBtnPressIn} onPressOut={onBtnPressOut} onPress={handleContinue}>
          <Animated.View
            style={[
              styles.nextButton,
              !selectedId && styles.nextButtonDisabled,
              { opacity: btnOpacity, transform: [{ scale: btnScale }] },
            ]}
          >
            <Text style={styles.nextButtonText}>Continua</Text>
            {selectedId && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    color: '#111111',
    letterSpacing: -0.3,
    lineHeight: 41,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#888888',
    lineHeight: 23,
  },
  subtitleAccent: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#F07B1D',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    shadowColor: '#F07B1D',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 999,
    marginRight: 16,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBgFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: '#111111',
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#F07B1D',
  },
  cardDescription: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: '#F07B1D',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#F07B1D',
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#F07B1D',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  nextButtonDisabled: {
    backgroundColor: '#FAD8C3',
  },
  nextButtonText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
