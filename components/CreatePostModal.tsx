import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Image,
  ScrollView, TextInput, SafeAreaView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { containsBlacklistedWord } from '../lib/blacklist';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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

const PRIVACY_OPTIONS = [
  { id: 'all', label: 'Pubblico', icon: 'globe-outline',       desc: 'Chiunque può vedere' },
  { id: 'me',  label: 'Solo io',  icon: 'lock-closed-outline', desc: 'Privato' },
] as const;

const OFFICIAL_GROUP_NAMES = [
  'Pittura', 'Scultura', 'Letteratura', 'Fotografia', 'Cucina Chef', 'Tattoo',
  'Design', 'Architettura', 'Archeologia', 'Storia', 'Recitazione e Danza',
  'Musica', 'Fumettistica', 'Arte di Strada', 'Partner',
];

/** Renderizza il testo con gli hashtag in arancione */
function DescriptionPreview({ text }: { text: string }) {
  const parts = text.split(/(\s)/);
  return (
    <Text style={preview.base} selectable={false}>
      {parts.map((part, i) =>
        part.startsWith('#') ? (
          <Text key={i} style={preview.hash}>{part}</Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
}
const preview = StyleSheet.create({
  base: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#111', lineHeight: 24 },
  hash: { color: ORANGE, fontFamily: 'PlusJakartaSans_600SemiBold' },
});

type Step = 'picker' | 'details';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished?: () => void;
  authorUserId?: string; // se presente, pubblica come quell'utente (es. JES official)
}

interface GroupOption { id: string; name: string; }

export default function CreatePostModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const [step, setStep] = useState<Step>('picker');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<'all' | 'follow' | 'close' | 'me'>('all');
  const [captionFocused, setCaptionFocused] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const reset = () => {
    setStep('picker');
    setImageUris([]);
    setCaption('');
    setPrivacy('all');
    setCaptionFocused(false);
    setSelectedGroupId(null);
  };

  const close = () => { reset(); onClose(); };

  // Carica tutti i gruppi ufficiali
  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, name')
        .in('name', OFFICIAL_GROUP_NAMES);
      if (data) {
        // Ordina secondo l'ordine di OFFICIAL_GROUP_NAMES
        const sorted = OFFICIAL_GROUP_NAMES
          .map(name => data.find((g: any) => g.name === name))
          .filter(Boolean) as GroupOption[];
        setGroups(sorted);
      }
    })();
  }, [visible]);

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
          allowsMultipleSelection: true,
          quality: 0.9,
        });
        if (result.canceled) { close(); return; }
        onPhotoSelected(result.assets.map(a => a.uri));
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  const onPhotoSelected = (uris: string[]) => {
    setImageUris(uris);
    setStep('details');
  };

  const canPublish = caption.trim().length > 0 && imageUris.length > 0;

  // Carica un'immagine su Supabase Storage e restituisce l'URL pubblico
  const uploadImage = async (uri: string): Promise<string> => {
    const ext      = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `posts/${fileName}`;
    const base64   = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
    const byteArray = decodeBase64(base64);
    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, byteArray, { contentType: `image/${ext}`, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const publish = async () => {
    if (!canPublish || publishing) return;
    // Controllo blacklist
    const blocked = await containsBlacklistedWord(caption.trim());
    if (blocked) {
      Alert.alert('Contenuto non consentito', `Il testo contiene una parola non ammessa: "${blocked}". Rimuovila per continuare.`);
      return;
    }
    setPublishing(true);
    try {
      // 1. Recupera utente corrente (o usa authorUserId per postare come JES)
      let postUserId = authorUserId ?? null;
      if (!postUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non sei loggato.');
        const { data: dbUser, error: userErr } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        if (userErr || !dbUser) throw new Error('Profilo non trovato.');
        postUserId = dbUser.id;
      }

      // 2. Upload immagini
      const uploadedUrls = await Promise.all(imageUris.map(uploadImage));

      // 3. Salva post
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          user_id:      postUserId,
          caption:      caption.trim(),
          image_urls:   uploadedUrls,          // array per multi-foto
          image_url:    uploadedUrls[0] ?? null, // legacy
          aspect_ratio: 1,
          privacy,
          ...(selectedGroup ? { group_id: selectedGroup.id, group_name: selectedGroup.name } : {}),
        })
        .select('id')
        .single();
      if (postErr || !post) throw new Error(`DB error: ${postErr?.code} - ${postErr?.message}`);

      // 4. Salva hashtag
      const tags = [...new Set((caption.match(/#\w+/g) || []).map(t => t.slice(1)))];
      if (tags.length > 0) {
        await supabase.from('post_tags').insert(tags.map(tag => ({ post_id: post.id, tag })));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Post pubblicato!', 'Il tuo post è ora nel feed.', [{
        text: 'OK', onPress: () => { close(); onPublished?.(); },
      }]);
    } catch (e: any) {
      Alert.alert('Errore', e.message || 'Impossibile pubblicare. Riprova.');
    } finally {
      setPublishing(false);
    }
  };

  const selectedPrivacy = PRIVACY_OPTIONS.find(p => p.id === privacy)!;

  return (
    <>
      {/* ── STEP 2: dettagli (la galleria nativa si apre via useEffect) ── */}
      <Modal visible={visible && step === 'details'} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setStep('picker')} style={styles.headerBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={26} color="#111" />
              </TouchableOpacity>
              {authorUserId ? (
                <View style={styles.jesAuthorRow}>
                  <Image source={require('../assets/images/icon.png')} style={styles.jesAuthorIcon} />
                  <View>
                    <Text style={styles.headerTitle}>Nuovo post</Text>
                    <Text style={styles.jesAuthorLabel}>Come JES Official</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.headerTitle}>Nuovo post</Text>
              )}
              <TouchableOpacity
                onPress={publish}
                style={[styles.publishBtn, (!canPublish || publishing) && styles.publishBtnOff]}
                activeOpacity={0.85}
                disabled={publishing}
              >
                {publishing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.publishText}>Pubblica</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >

              {/* Foto selezionate */}
              {imageUris.length === 1 ? (
                <Image source={{ uri: imageUris[0] }} style={styles.singlePhoto} resizeMode="cover" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.multiRow} contentContainerStyle={styles.multiRowContent}>
                  {imageUris.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={styles.multiPhoto} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}

              {/* Bottone cambia foto */}
              <TouchableOpacity style={styles.changePhotoBtn} onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'] as any,
                  allowsMultipleSelection: true,
                  quality: 0.9,
                });
                if (!result.canceled) onPhotoSelected(result.assets.map(a => a.uri));
              }} activeOpacity={0.75}>
                <Ionicons name="images-outline" size={16} color="#888" />
                <Text style={styles.changePhotoBtnText}>Cambia foto</Text>
              </TouchableOpacity>

              {/* Testo del post (titolo + descrizione unificati) */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Testo <Text style={styles.req}>*</Text>
                  <Text style={styles.hashHint}>  Scrivi #hashtag per evidenziarli</Text>
                </Text>
                <View style={styles.descWrap}>
                  {!captionFocused && caption.length > 0 ? (
                    <TouchableOpacity onPress={() => setCaptionFocused(true)} activeOpacity={1} style={styles.descPreviewTouch}>
                      <DescriptionPreview text={caption} />
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={styles.descInput}
                      placeholder={'Es. «La mia ultima opera»\n\nRacconta qualcosa sul tuo lavoro...\nUsa #hashtag per essere trovato più facilmente'}
                      placeholderTextColor="#CCC"
                      value={caption}
                      onChangeText={setCaption}
                      multiline
                      maxLength={600}
                      textAlignVertical="top"
                      onFocus={() => setCaptionFocused(true)}
                      onBlur={() => setCaptionFocused(false)}
                      autoFocus={captionFocused}
                    />
                  )}
                </View>
                {captionFocused && caption.includes('#') && (
                  <View style={styles.hashPreviewBox}>
                    <DescriptionPreview text={caption} />
                  </View>
                )}
              </View>

              {/* Gruppo (opzionale) */}
              {groups.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Pubblica anche nel gruppo <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', color: '#AAA', fontSize: 12 }}>(opzionale)</Text></Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[styles.groupChip, !selectedGroupId && styles.groupChipActive]}
                      onPress={() => setSelectedGroupId(null)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.groupChipText, !selectedGroupId && styles.groupChipTextActive]}>Solo feed</Text>
                    </TouchableOpacity>
                    {groups.map(g => (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.groupChip, selectedGroupId === g.id && styles.groupChipActive]}
                        onPress={() => setSelectedGroupId(g.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="people-outline" size={13} color={selectedGroupId === g.id ? '#fff' : '#888'} />
                        <Text style={[styles.groupChipText, selectedGroupId === g.id && styles.groupChipTextActive]}>{g.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Privacy */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Chi può vedere</Text>
                <View style={styles.privacyGrid}>
                  {PRIVACY_OPTIONS.map(opt => {
                    const active = privacy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.privacyCard, active && styles.privacyCardActive]}
                        onPress={() => { setPrivacy(opt.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        activeOpacity={0.75}
                      >
                        <Ionicons name={opt.icon as any} size={22} color={active ? ORANGE : '#999'} />
                        <Text style={[styles.privacyCardLabel, active && styles.privacyCardLabelActive]}>{opt.label}</Text>
                        <Text style={styles.privacyCardDesc}>{opt.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#fff' },
  flex:                { flex: 1 },

  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerBtn:           { width: 40 },
  headerTitle:         { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#111' },
  jesAuthorRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  jesAuthorIcon:       { width: 32, height: 32, borderRadius: 8 },
  jesAuthorLabel:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: ORANGE, marginTop: 1 },
  publishBtn:          { backgroundColor: ORANGE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22 },
  publishBtnOff:       { backgroundColor: '#E0E0E0' },
  publishText:         { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },

  scroll:              { paddingBottom: 60 },

  singlePhoto:         { width: SW, height: SW * 0.75 },
  multiRow:            { marginBottom: 0 },
  multiRowContent:     { paddingHorizontal: 16, gap: 10, paddingVertical: 16 },
  multiPhoto:          { width: 160, height: 160, borderRadius: 14 },

  changePhotoBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 10, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F5F5F5' },
  changePhotoBtnText:  { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: '#666' },

  field:               { paddingHorizontal: 20, paddingTop: 22 },
  fieldLabel:          { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#333', marginBottom: 10 },
  req:                 { color: ORANGE },
  hashHint:            { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#BBB' },

  titleInput:          { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, color: '#111', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13 },

  descWrap:            { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, minHeight: 110, overflow: 'hidden' },
  descInput:           { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#111', paddingHorizontal: 16, paddingVertical: 13, minHeight: 110, lineHeight: 24, textAlignVertical: 'top' },
  descPreviewTouch:    { paddingHorizontal: 16, paddingVertical: 13 },
  hashPreviewBox:      { marginTop: 8, padding: 12, backgroundColor: '#FFF8F3', borderRadius: 12, borderWidth: 1, borderColor: ORANGE + '30' },

  groupChip:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  groupChipActive:     { backgroundColor: ORANGE, borderColor: ORANGE },
  groupChipText:       { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#888' },
  groupChipTextActive: { color: '#fff' },

  privacyGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  privacyCard:         { width: (SW - 40 - 10) / 2, borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, padding: 14, gap: 5, backgroundColor: '#FAFAFA' },
  privacyCardActive:   { borderColor: ORANGE, backgroundColor: '#FFF8F3' },
  privacyCardLabel:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#444' },
  privacyCardLabelActive: { color: ORANGE },
  privacyCardDesc:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA' },
});
