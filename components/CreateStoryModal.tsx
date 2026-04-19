import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Image,
  TextInput, SafeAreaView, Alert, Dimensions, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

// Util per il decoding sicuro in React Native
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decodeBase64(base64: string): Uint8Array {
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let i; let p = 0;
  let encoded1; let encoded2; let encoded3; let encoded4;
  if (base64[len - 1] === '=') Object.is(base64[len - 2], '=') ? bufferLength -= 2 : bufferLength--;
  const arraybuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arraybuffer);
  for (i = 0; i < len; i += 4) {
    encoded1 = chars.indexOf(base64[i]);
    encoded2 = chars.indexOf(base64[i + 1]);
    encoded3 = chars.indexOf(base64[i + 2]);
    encoded4 = chars.indexOf(base64[i + 3]);
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes;
}

const { width: SW, height: SH } = Dimensions.get('window');
const ORANGE = '#F07B1D';

const PRIVACY_OPTS = [
  { id: 'all', label: 'Pubblico', icon: 'globe-outline',       desc: 'Visibile a chiunque' },
  { id: 'me',  label: 'Solo io',  icon: 'lock-closed-outline', desc: 'Privato' },
] as const;

const TEXT_COLORS = ['#FFFFFF', '#000000', ORANGE, '#FFD700', '#FF3B30', '#34C759', '#5B6AF5'];

interface TextOverlay { id: string; text: string; y: number; color: string; }

type Step = 'picker' | 'editor';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished?: () => void;
  authorUserId?: string;
}

export default function CreateStoryModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const [step, setStep] = useState<Step>('picker');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [showTextInput, setShowTextInput] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText] = useState('');

  const [showMentionInput, setShowMentionInput] = useState(false);
  const [mentionText, setMentionText] = useState('');

  const [privacy, setPrivacy] = useState<'all' | 'me'>('all');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [imageOverlays, setImageOverlays] = useState<{ id: string; uri: string; y: number }[]>([]);

  const reset = () => {
    setStep('picker');
    setImageUri(null);
    setOverlays([]);
    setImageOverlays([]);
    setCurrentText('');
    setTextColor('#FFFFFF');
    setLinkText('');
    setMentionText('');
    setPrivacy('all');
    setShowTextInput(false);
    setShowLinkInput(false);
    setShowMentionInput(false);
    setShowPrivacy(false);
  };

  const close = () => { reset(); onClose(); };

  // Apre la galleria nativa al posto di MediaPickerModal
  useEffect(() => {
    if (visible && step === 'picker') {
      (async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Accesso necessario', 'Consenti l\'accesso alla galleria nelle impostazioni.');
          close();
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'] as any,
          allowsMultipleSelection: false,
          quality: 0.9,
        });
        if (result.canceled) { close(); return; }
        onPhotoSelected([result.assets[0].uri]);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const onPhotoSelected = (uris: string[]) => {
    setImageUri(uris[0]);
    setStep('editor');
  };

  const addText = () => {
    if (!currentText.trim()) return;
    setOverlays(prev => [...prev, { id: Date.now().toString(), text: currentText.trim(), y: 180 + prev.length * 56, color: textColor }]);
    setCurrentText('');
    setShowTextInput(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addOverlayImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) {
      setImageOverlays(prev => [
        ...prev,
        { id: Date.now().toString(), uri: result.assets[0].uri, y: 200 + prev.length * 90 },
      ]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const publish = async () => {
    if (!imageUri || publishing) return;
    setPublishing(true);
    try {
      // 1. Utente corrente (o authorUserId per postare come JES)
      let storyUserId = authorUserId ?? null;
      if (!storyUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non sei loggato.');
        const { data: dbUser, error: userErr } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        if (userErr || !dbUser) throw new Error('Profilo non trovato.');
        storyUserId = dbUser.id;
      }

      // 2. Upload immagine
      const ext      = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `stories/${fileName}`;
      const base64   = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' as any });
      const byteArray = decodeBase64(base64);
      const { error: uploadErr } = await supabase.storage
        .from('media').upload(filePath, byteArray, { contentType: `image/${ext}`, upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);

      // 3. Salva storia
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // 30 giorni
      const { error: storyErr } = await supabase.from('stories').insert({
        user_id:    storyUserId,
        image_url:  urlData.publicUrl,
        link_url:   linkText   || null,
        mention:    mentionText || null,
        privacy,
        expires_at: expires.toISOString(),
      });
      if (storyErr) throw new Error(storyErr.message);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Storia pubblicata!', 'Visibile per 30 giorni.', [{
        text: 'OK', onPress: () => { close(); onPublished?.(); },
      }]);
    } catch (e: any) {
      Alert.alert('Errore', e.message || 'Impossibile pubblicare. Riprova.');
    } finally {
      setPublishing(false);
    }
  };

  const closeAllInputs = () => { setShowTextInput(false); setShowLinkInput(false); setShowMentionInput(false); setShowPrivacy(false); };

  return (
    <>
      {/* ── STEP 2: editor storia (la galleria nativa si apre via useEffect) ── */}
      <Modal visible={visible && step === 'editor'} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

            {/* Canvas */}
            <View style={styles.canvas}>
              {imageUri && <Image source={{ uri: imageUri }} style={styles.bg} resizeMode="cover" />}

              {/* Overlay testi */}
              {overlays.map(ov => (
                <View key={ov.id} style={[styles.overlayTextWrap, { top: ov.y }]}>
                  <Text style={[styles.overlayText, { color: ov.color }]}>{ov.text}</Text>
                </View>
              ))}

              {/* Overlay immagini */}
              {imageOverlays.map(ov => (
                <View key={ov.id} style={[styles.overlayImageWrap, { top: ov.y }]}>
                  <Image source={{ uri: ov.uri }} style={styles.overlayImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.overlayImageRemove}
                    onPress={() => setImageOverlays(prev => prev.filter(o => o.id !== ov.id))}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Link badge */}
              {linkText ? (
                <View style={styles.linkBadge}>
                  <Ionicons name="link" size={13} color="#fff" />
                  <Text style={styles.linkBadgeText} numberOfLines={1}>{linkText}</Text>
                </View>
              ) : null}

              {/* Mention badge */}
              {mentionText ? (
                <View style={styles.mentionBadge}>
                  <Text style={styles.mentionBadgeText}>@{mentionText}</Text>
                </View>
              ) : null}

              {/* Toolbar top */}
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setStep('picker')} style={styles.topBtn} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={styles.topTools}>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => { closeAllInputs(); setShowTextInput(true); }} activeOpacity={0.8}>
                    <Ionicons name="text" size={19} color="#fff" />
                    <Text style={styles.toolLabel}>Testo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => { closeAllInputs(); setShowLinkInput(true); }} activeOpacity={0.8}>
                    <Ionicons name="link-outline" size={19} color="#fff" />
                    <Text style={styles.toolLabel}>Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={addOverlayImage} activeOpacity={0.8}>
                    <Ionicons name="image-outline" size={19} color="#fff" />
                    <Text style={styles.toolLabel}>Foto</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => { closeAllInputs(); setShowMentionInput(true); }} activeOpacity={0.8}>
                    <Ionicons name="at-outline" size={19} color="#fff" />
                    <Text style={styles.toolLabel}>Menziona</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input testo */}
              {showTextInput && (
                <View style={styles.inputPanel}>
                  <Text style={styles.inputPanelTitle}>Aggiungi testo</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {TEXT_COLORS.map(c => (
                      <TouchableOpacity key={c} onPress={() => setTextColor(c)}
                        style={[styles.colorDot, { backgroundColor: c }, textColor === c && styles.colorDotActive]} />
                    ))}
                  </ScrollView>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.panelInput, { color: textColor }]}
                      placeholder="Scrivi qualcosa..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={currentText}
                      onChangeText={setCurrentText}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.confirmBtn} onPress={addText}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTextInput(false)}>
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Input link */}
              {showLinkInput && (
                <View style={styles.inputPanel}>
                  <Text style={styles.inputPanelTitle}>Aggiungi link</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.panelInput}
                      placeholder="https://..."
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={linkText}
                      onChangeText={setLinkText}
                      autoCapitalize="none"
                      keyboardType="url"
                      autoFocus
                    />
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowLinkInput(false)}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Input menzione */}
              {showMentionInput && (
                <View style={styles.inputPanel}>
                  <Text style={styles.inputPanelTitle}>Menziona qualcuno</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.atSign}>@</Text>
                    <TextInput
                      style={styles.panelInput}
                      placeholder="username"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={mentionText}
                      onChangeText={setMentionText}
                      autoCapitalize="none"
                      autoFocus
                    />
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowMentionInput(false)}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Barra privcy + pubblica */}
              <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.privacyBtn} onPress={() => setShowPrivacy(p => !p)} activeOpacity={0.8}>
                  <Ionicons name={PRIVACY_OPTS.find(p => p.id === privacy)?.icon as any} size={17} color="#fff" />
                  <Text style={styles.privacyBtnText}>{PRIVACY_OPTS.find(p => p.id === privacy)?.label}</Text>
                  <Ionicons name="chevron-up" size={13} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.publishBtn} onPress={publish} activeOpacity={0.85} disabled={publishing}>
                  {publishing
                    ? <ActivityIndicator color="#fff" />
                    : <>
                        <Text style={styles.publishText}>Pubblica storia</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </>
                  }
                </TouchableOpacity>
              </View>

              {/* Privacy sheet */}
              {showPrivacy && (
                <View style={styles.privacySheet}>
                  <Text style={styles.privacySheetTitle}>Chi può vedere la storia?</Text>
                  {PRIVACY_OPTS.map(opt => (
                    <TouchableOpacity key={opt.id} style={styles.privacyRow}
                      onPress={() => { setPrivacy(opt.id); setShowPrivacy(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                      <View style={[styles.privacyIcon, privacy === opt.id && styles.privacyIconActive]}>
                        <Ionicons name={opt.icon as any} size={20} color={privacy === opt.id ? '#fff' : '#555'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.privacyRowLabel, privacy === opt.id && { color: ORANGE }]}>{opt.label}</Text>
                        <Text style={styles.privacyRowDesc}>{opt.desc}</Text>
                      </View>
                      {privacy === opt.id && <Ionicons name="checkmark-circle" size={22} color={ORANGE} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  flex:             { flex: 1 },

  canvas:           { flex: 1, position: 'relative' },
  bg:               { ...StyleSheet.absoluteFillObject },

  topBar:           { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  topBtn:           { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  topTools:         { flexDirection: 'row', gap: 6 },
  toolBtn:          { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, gap: 2 },
  toolLabel:        { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 10, color: '#fff' },

  overlayTextWrap:  { position: 'absolute', left: 20 },
  overlayImageWrap: { position: 'absolute', alignSelf: 'center', left: SW / 2 - 65, width: 130, height: 130, borderRadius: 12, overflow: 'hidden' },
  overlayImage:     { width: '100%', height: '100%' },
  overlayImageRemove: { position: 'absolute', top: 4, right: 4 },
  overlayText:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 24, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6 },

  linkBadge:        { position: 'absolute', bottom: 140, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22 },
  linkBadgeText:    { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: '#fff', maxWidth: 220 },
  mentionBadge:     { position: 'absolute', bottom: 185, alignSelf: 'center', backgroundColor: 'rgba(240,123,29,0.9)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22 },
  mentionBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff' },

  inputPanel:       { position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', padding: 16, gap: 10 },
  inputPanelTitle:  { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#fff', marginBottom: 4 },
  inputRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelInput:       { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#fff', borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.3)', paddingBottom: 6 },
  confirmBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },
  cancelBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  atSign:           { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: '#fff' },

  colorDot:         { width: 30, height: 30, borderRadius: 15, marginRight: 8, borderWidth: 2.5, borderColor: 'transparent' },
  colorDotActive:   { borderColor: '#fff', transform: [{ scale: 1.25 }] },

  bottomBar:        { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, paddingTop: 14, backgroundColor: 'rgba(0,0,0,0.55)' },
  privacyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 22 },
  privacyBtnText:   { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#fff' },
  publishBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ORANGE, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 26 },
  publishText:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },

  privacySheet:         { position: 'absolute', bottom: 75, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 22, padding: 20, gap: 2 },
  privacySheetTitle:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#111', marginBottom: 14 },
  privacyRow:           { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  privacyIcon:          { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  privacyIconActive:    { backgroundColor: ORANGE },
  privacyRowLabel:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#222' },
  privacyRowDesc:       { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA', marginTop: 2 },
});
