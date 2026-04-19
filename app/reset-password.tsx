import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

function FocusableInput(props: React.ComponentProps<typeof TextInput> & { secure?: boolean }) {
  const [focused, setFocused] = useState(false);
  const { secure, ...rest } = props;
  return (
    <TextInput
      {...rest}
      secureTextEntry={secure}
      style={[styles.input, focused && styles.inputFocused]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor="#AAAAAA"
    />
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const opacity = useRef(new Animated.Value(1)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(scale,   { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const handleUpdate = async () => {
    if (loading) return;
    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Errore', 'Le password non corrispondono.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert('Errore', error.message);
    } else {
      Alert.alert('Password aggiornata!', 'Ora puoi accedere con la nuova password.', [
        { text: 'OK', onPress: () => router.replace('/home') },
      ]);
    }
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
        <View style={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={styles.title}>Nuova password</Text>
          <Text style={styles.description}>
            Scegli una nuova password per il tuo account. Deve essere di almeno 6 caratteri.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nuova password</Text>
              <FocusableInput
                value={password}
                onChangeText={setPassword}
                placeholder="Almeno 6 caratteri"
                secure
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Conferma password</Text>
              <FocusableInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Ripeti la password"
                secure
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handleUpdate}>
              <Animated.View style={[styles.submitButton, { opacity, transform: [{ scale }] }]}>
                <Text style={styles.submitButtonText}>
                  {loading ? 'Salvataggio…' : 'Aggiorna password'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView:     { flex: 1 },
  header:           { paddingHorizontal: 8, paddingVertical: 8 },
  backButton:       { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content:          { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: '#111111',
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#666666',
    lineHeight: 23,
    marginBottom: 32,
  },
  form:       { width: '100%' },
  inputGroup: { marginBottom: 24 },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#111111',
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111111',
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#F07B1D',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
  },
});
