import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function OnboardingUsernameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { firstName, lastName } = useLocalSearchParams<{ firstName: string; lastName: string }>();

  const f = (firstName || 'user').toLowerCase().replace(/\s/g, '');
  const l = (lastName || 'name').toLowerCase().replace(/\s/g, '');

  const suggestions = [
    `${f}.${l}`,
    `${f}_${l}`,
    `${f}${l}${Math.floor(Math.random() * 90) + 10}`,
    `the.${f}`,
  ];

  const [username, setUsername] = useState(`${f}${l}`);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const clean = text.replace(/[@\s]/g, '').replace(/[^a-zA-Z0-9._]/g, '');
    setUsername(clean);
  };

  const applySuggestion = (s: string) => {
    setUsername(s);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const isValid = username.length >= 3;
  const tooShort = username.length > 0 && username.length < 3;

  const handleContinue = async () => {
    if (!isValid) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ username }).eq('auth_id', user.id);
      }
    } catch { /* non bloccare il flusso */ }
    router.push('/onboarding-age');
  };

  const btnOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (!isValid) return;
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(btnOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#111111" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Il tuo username</Text>
            <Text style={styles.subtitle}>Scegli bene, non potrai cambiarlo</Text>

            <Pressable
              onPress={() => inputRef.current?.focus()}
              style={styles.usernameBlock}
            >
              <Text
                style={[styles.usernameDisplay, !username && styles.usernamePlaceholder]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                @{username || 'username'}
              </Text>
            </Pressable>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={username}
              onChangeText={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={[styles.underline, isFocused && styles.underlineFocused]} />

            {tooShort && (
              <View style={styles.warningRow}>
                <Ionicons name="information-circle-outline" size={15} color="#E74C3C" />
                <Text style={styles.warningText}>Minimo 3 caratteri</Text>
              </View>
            )}

            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsLabel}>Suggerimenti</Text>
              <View style={styles.pillsGrid}>
                {suggestions.map((s, i) => {
                  const active = username === s;
                  return (
                    <SuggestionPill
                      key={i}
                      label={`@${s}`}
                      active={active}
                      onPress={() => applySuggestion(s)}
                    />
                  );
                })}
              </View>
            </View>
          </View>

          <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handleContinue}>
              <Animated.View
                style={[
                  styles.nextButton,
                  !isValid && styles.nextButtonDisabled,
                  { opacity: btnOpacity, transform: [{ scale: btnScale }] },
                ]}
              >
                <Text style={styles.nextButtonText}>Continua</Text>
                {isValid && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SuggestionPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.pill, active && styles.pillActive, { opacity }]}>
        {active && <Ionicons name="checkmark" size={13} color="#F07B1D" style={{ marginRight: 4 }} />}
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: { flex: 1 },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 34,
    color: '#111111',
    letterSpacing: -0.3,
    lineHeight: 41,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 32,
  },
  usernameBlock: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  usernameDisplay: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 44,
    color: '#111111',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  usernamePlaceholder: {
    color: '#DDDDDD',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  underline: {
    height: 3,
    width: 36,
    borderRadius: 2,
    backgroundColor: '#EEEEEE',
    marginBottom: 16,
  },
  underlineFocused: {
    width: 56,
    backgroundColor: '#F07B1D',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 40,
  },
  warningText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#E74C3C',
  },
  suggestionsSection: {
    width: '100%',
    alignItems: 'center',
  },
  suggestionsLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#888888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
  },
  pillActive: {
    backgroundColor: '#FFF5EC',
    borderWidth: 1.5,
    borderColor: '#F07B1D',
  },
  pillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#666666',
  },
  pillTextActive: {
    color: '#F07B1D',
  },
  bottomContainer: {
    // padding handled inline with insets
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
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
  },
});
