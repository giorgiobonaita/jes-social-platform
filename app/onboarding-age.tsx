import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function OnboardingAgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [age, setAge] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const ageNum = parseInt(age);
  const tooYoung = age.trim().length > 0 && !isNaN(ageNum) && ageNum < 16;
  const isNextEnabled = age.trim().length > 0 && !isNaN(ageNum) && ageNum >= 16;

  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (!isNextEnabled) return;
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
            <Text style={styles.title}>Quanti anni hai?</Text>

            <View style={[styles.inputContainer, focused && !tooYoung && styles.inputContainerFocused, tooYoung && styles.inputContainerError]}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={age}
                onChangeText={setAge}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="25"
                placeholderTextColor="#AAAAAA"
              />
            </View>

            {tooYoung ? (
              <Text style={styles.errorText}>
                Devi avere almeno 16 anni per iscriverti a JES.
              </Text>
            ) : (
              <Text style={styles.hintText}>
                Questo serve a personalizzare la tua esperienza e non sarà visibile sul profilo
              </Text>
            )}
          </View>

          <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Pressable
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={async () => {
                if (!isNextEnabled) return;
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const birthYear = new Date().getFullYear() - ageNum;
                    await supabase.from('users')
                      .update({ birth_date: `${birthYear}-01-01` })
                      .eq('auth_id', user.id);
                  }
                } catch { /* non bloccare il flusso */ }
                router.push('/onboarding-photo');
              }}
            >
              <Animated.View
                style={[
                  styles.nextButton,
                  !isNextEnabled && styles.nextButtonDisabled,
                  { opacity, transform: [{ scale }] },
                ]}
              >
                <Text style={styles.nextButtonText}>Avanti</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.nextIcon} />
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
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
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: '#111111',
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 32,
  },
  inputContainer: {
    width: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    marginBottom: 8,
  },
  inputContainerFocused: {
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#111111',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  hintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 16,
  },
  errorText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  bottomContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#F07B1D',
    height: 52,
    width: '100%',
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
  nextIcon: {
    marginLeft: 8,
  },
});
