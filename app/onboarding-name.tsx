import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function FocusableInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[styles.input, focused && styles.inputFocused, props.style]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor="#AAAAAA"
    />
  );
}

export default function OnboardingNameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const isNextEnabled = firstName.trim().length > 0 && lastName.trim().length > 0;

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
            <Text style={styles.title}>Come ti chiami?</Text>

            <View style={styles.row}>
              <FocusableInput
                style={styles.halfInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Nome"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                textAlign="center"
              />
              <FocusableInput
                style={styles.halfInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Cognome"
                autoCapitalize="words"
                autoCorrect={false}
                textAlign="center"
              />
            </View>

            <Text style={styles.subtitle}>Le persone usano nomi reali su JES</Text>
          </View>

          <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
            <Pressable
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() =>
                isNextEnabled &&
                router.push({ pathname: '/onboarding-username', params: { firstName, lastName } })
              }
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
  row: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111111',
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    backgroundColor: '#FFFFFF',
  },
  halfInput: {
    flex: 1,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#666666',
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
