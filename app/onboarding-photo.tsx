import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let i; let p = 0;
  let e1: number; let e2: number; let e3: number; let e4: number;
  if (base64[len - 1] === '=') { Object.is(base64[len - 2], '=') ? bufferLength -= 2 : bufferLength--; }
  const bytes = new Uint8Array(new ArrayBuffer(bufferLength));
  for (i = 0; i < len; i += 4) {
    e1 = chars.indexOf(base64[i]);
    e2 = chars.indexOf(base64[i + 1]);
    e3 = chars.indexOf(base64[i + 2]);
    e4 = chars.indexOf(base64[i + 3]);
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    bytes[p++] = ((e3 & 3) << 6) | (e4 & 63);
  }
  return bytes;
}

export default function OnboardingPhotoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Errore', "Non è stato possibile caricare l'immagine. Riprova.");
    }
  };

  const handleContinue = async () => {
    if (!photoUri) {
      router.push('/onboarding-categories');
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding-categories'); return; }
      const { data: dbUser } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) { router.push('/onboarding-categories'); return; }

      const ext = photoUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `avatars/${dbUser.id}_${Date.now()}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(photoUri, { encoding: 'base64' as any });
      const bytes = decodeBase64(base64);
      const { error: uploadErr } = await supabase.storage
        .from('media').upload(filePath, bytes, { contentType: `image/${ext}`, upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        await supabase.from('users')
          .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
          .eq('id', dbUser.id);
      }
    } catch {
      // non bloccare il flusso se l'upload fallisce
    } finally {
      setUploading(false);
    }
    router.push('/onboarding-categories');
  };

  const avatarOpacity = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const onAvatarPressIn = () => Animated.timing(avatarOpacity, { toValue: 0.65, duration: 80, useNativeDriver: true }).start();
  const onAvatarPressOut = () => Animated.timing(avatarOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  const onBtnPressIn = () => {
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

  const addBtnOpacity = useRef(new Animated.Value(1)).current;
  const onAddPressIn = () => Animated.timing(addBtnOpacity, { toValue: 0.65, duration: 80, useNativeDriver: true }).start();
  const onAddPressOut = () => Animated.timing(addBtnOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();

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

      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Aggiungi una foto</Text>
          <Text style={styles.subtitle}>
            Tocca il cerchio o il pulsante qui sotto per scegliere la tua foto profilo
          </Text>

          <Pressable onPress={handlePickPhoto} onPressIn={onAvatarPressIn} onPressOut={onAvatarPressOut}>
            <Animated.View style={[styles.photoUploadContainer, { opacity: avatarOpacity }]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.emptyPhoto}>
                  <Ionicons name="person" size={64} color="#CCCCCC" />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
              </View>
            </Animated.View>
          </Pressable>

          <Pressable
            onPress={handlePickPhoto}
            onPressIn={onAddPressIn}
            onPressOut={onAddPressOut}
            style={styles.addPhotoButton}
          >
            <Animated.View style={[styles.addPhotoInner, { opacity: addBtnOpacity }]}>
              <Ionicons name="image-outline" size={20} color="#F07B1D" />
              <Text style={styles.addPhotoText}>
                {photoUri ? 'Cambia foto' : 'Aggiungi foto'}
              </Text>
            </Animated.View>
          </Pressable>
        </View>

        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            onPressIn={onBtnPressIn}
            onPressOut={onBtnPressOut}
            onPress={handleContinue}
            disabled={uploading}
          >
            <Animated.View style={[styles.nextButton, { opacity: btnOpacity, transform: [{ scale: btnScale }] }]}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>{photoUri ? 'Continua' : 'Salta'}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.nextIcon} />
                </>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 8, paddingVertical: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },
  formContainer: { flex: 1, alignItems: 'center', paddingTop: 40 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 28, color: '#111111', letterSpacing: -0.3, lineHeight: 34, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#888888', textAlign: 'center', lineHeight: 23, marginBottom: 40, paddingHorizontal: 16 },
  photoUploadContainer: { width: 160, height: 160, borderRadius: 999, position: 'relative' },
  emptyPhoto: { width: 160, height: 160, borderRadius: 999, backgroundColor: '#EEEEEE', justifyContent: 'center', alignItems: 'center' },
  photoPreview: { width: 160, height: 160, borderRadius: 999, backgroundColor: '#EEEEEE' },
  cameraBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#F07B1D', width: 36, height: 36, borderRadius: 999, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  addPhotoButton: { marginTop: 24, minHeight: 44, justifyContent: 'center' },
  addPhotoInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24 },
  addPhotoText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#F07B1D' },
  bottomContainer: {},
  nextButton: { flexDirection: 'row', backgroundColor: '#F07B1D', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  nextButtonText: { color: '#FFFFFF', fontFamily: 'Poppins_800ExtraBold', fontSize: 16 },
  nextIcon: { marginLeft: 8 },
});
