import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  TextInput, SafeAreaView, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';

const PRIVACY_OPTIONS = [
  { id: 'all',    label: 'Tutti',           icon: 'globe-outline',       desc: 'Chiunque può votare' },
  { id: 'follow', label: 'Follower',        icon: 'people-outline',      desc: 'Solo chi ti segue' },
] as const;

const DURATIONS = [
  { id: '1d', label: '1 giorno' },
  { id: '3d', label: '3 giorni' },
  { id: '7d', label: '7 giorni' },
] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePollModal({ visible, onClose }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [privacy, setPrivacy] = useState<'all' | 'follow'>('all');
  const [duration, setDuration] = useState<'1d' | '3d' | '7d'>('1d');

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setPrivacy('all');
    setDuration('1d');
  };

  const close = () => { reset(); onClose(); };

  const updateOption = (i: number, val: string) =>
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));

  const addOption = () => { if (options.length < 5) setOptions(prev => [...prev, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(prev => prev.filter((_, idx) => idx !== i)); };

  const filledOptions = options.filter(o => o.trim().length > 0);
  const canPublish = question.trim().length > 0 && filledOptions.length >= 2;

  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (!canPublish || publishing) {
      if (!canPublish) Alert.alert('Manca qualcosa', 'Inserisci una domanda e almeno 2 risposte.');
      return;
    }
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non loggato');
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) throw new Error('Profilo non trovato');

      const pollOptions = filledOptions.map((opt, idx) => ({
        id: String.fromCharCode(65 + idx),
        label: opt,
        votes: 0
      }));

      const durationDays: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };
      const expires = new Date();
      expires.setDate(expires.getDate() + (durationDays[duration] ?? 1));

      const { error } = await supabase.from('posts').insert({
        user_id: dbUser.id,
        type: 'poll',
        poll_question: question.trim(),
        poll_options: pollOptions,
        aspect_ratio: 1,
        privacy: 'all',
        expires_at: expires.toISOString(),
      });

      if (error) throw new Error(error.message);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sondaggio pubblicato!', 'È ora visibile nel feed.', [{ text: 'OK', onPress: close }]);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={close} style={styles.headerBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuovo sondaggio</Text>
            <TouchableOpacity
              onPress={publish}
              style={[styles.publishBtn, !canPublish && styles.publishBtnOff]}
              activeOpacity={0.85}
            >
              <Text style={styles.publishText}>Pubblica</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >

            {/* Domanda */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Domanda <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.questionInput}
                placeholder="Cosa vuoi chiedere al tuo pubblico?"
                placeholderTextColor="#CCC"
                value={question}
                onChangeText={setQuestion}
                maxLength={200}
                multiline
                autoFocus
              />
              <Text style={styles.charCount}>{question.length}/200</Text>
            </View>

            {/* Risposte */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Risposte <Text style={styles.req}>*</Text>
                <Text style={styles.sectionNote}> — minimo 2, massimo 5</Text>
              </Text>
              {options.map((opt, i) => (
                <View key={i} style={styles.optRow}>
                  <View style={styles.optBullet}>
                    <Text style={styles.optBulletText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <TextInput
                    style={styles.optInput}
                    placeholder={`Risposta ${String.fromCharCode(65 + i)}`}
                    placeholderTextColor="#CCC"
                    value={opt}
                    onChangeText={v => updateOption(i, v)}
                    maxLength={80}
                    returnKeyType="next"
                  />
                  {i >= 2 && (
                    <TouchableOpacity
                      onPress={() => removeOption(i)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={24} color="#DDD" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {options.length < 5 && (
                <TouchableOpacity style={styles.addBtn} onPress={addOption} activeOpacity={0.75}>
                  <Ionicons name="add-circle-outline" size={20} color={ORANGE} />
                  <Text style={styles.addBtnText}>Aggiungi un'altra risposta</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Chi può votare — NON opzionale */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Chi può votare <Text style={styles.req}>*</Text>
              </Text>
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
                      <Ionicons name={opt.icon as any} size={24} color={active ? ORANGE : '#999'} />
                      <Text style={[styles.privacyLabel, active && styles.privacyLabelActive]}>{opt.label}</Text>
                      <Text style={styles.privacyDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Durata */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Durata del sondaggio</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.durationChip, duration === d.id && styles.durationChipActive]}
                    onPress={() => setDuration(d.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={duration === d.id ? '#fff' : '#888'}
                    />
                    <Text style={[styles.durationText, duration === d.id && styles.durationTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Anteprima sondaggio */}
            {(question.trim() || filledOptions.length > 0) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Anteprima</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewTag}>
                    <Ionicons name="bar-chart-outline" size={13} color={ORANGE} />
                    <Text style={styles.previewTagText}>SONDAGGIO</Text>
                  </View>
                  <Text style={styles.previewQuestion} numberOfLines={3}>
                    {question.trim() || '...'}
                  </Text>
                  {options.filter(o => o.trim()).map((o, i) => (
                    <View key={i} style={styles.previewOpt}>
                      <View style={[styles.previewOptBar, { width: i === 0 ? '65%' : '35%' }]} />
                      <Text style={styles.previewOptText}>{o}</Text>
                      <Text style={styles.previewOptPct}>{i === 0 ? '65%' : '35%'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff' },
  flex:               { flex: 1 },

  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerBtn:          { width: 40 },
  headerTitle:        { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#111' },
  publishBtn:         { backgroundColor: ORANGE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22 },
  publishBtnOff:      { backgroundColor: '#E0E0E0' },
  publishText:        { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },

  scroll:             { paddingBottom: 60 },

  section:            { paddingHorizontal: 20, paddingTop: 26 },
  sectionTitle:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#222', marginBottom: 12 },
  sectionNote:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#AAA' },
  req:                { color: ORANGE },

  questionInput:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 17, color: '#111', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 90, textAlignVertical: 'top', lineHeight: 26 },
  charCount:          { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#CCC', textAlign: 'right', marginTop: 6 },

  optRow:             { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  optBullet:          { width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE + '18', justifyContent: 'center', alignItems: 'center' },
  optBulletText:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: ORANGE },
  optInput:           { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#111', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  addBtn:             { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderWidth: 1.5, borderColor: ORANGE + '50', borderRadius: 14, justifyContent: 'center', borderStyle: 'dashed' },
  addBtnText:         { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: ORANGE },

  privacyGrid:        { flexDirection: 'row', gap: 10 },
  privacyCard:        { flex: 1, borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 16, padding: 14, gap: 6, backgroundColor: '#FAFAFA', alignItems: 'center' },
  privacyCardActive:  { borderColor: ORANGE, backgroundColor: '#FFF8F3' },
  privacyLabel:       { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#444', textAlign: 'center' },
  privacyLabelActive: { color: ORANGE },
  privacyDesc:        { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#AAA', textAlign: 'center' },

  durationRow:        { flexDirection: 'row', gap: 10 },
  durationChip:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  durationChipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  durationText:       { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#777' },
  durationTextActive: { color: '#fff' },

  previewSection:     { paddingHorizontal: 20, paddingTop: 28 },
  previewTitle:       { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#AAA', marginBottom: 10, letterSpacing: 0.5 },
  previewCard:        { borderRadius: 18, borderWidth: 1, borderColor: '#EEEEEE', padding: 18, backgroundColor: '#FAFAFA', gap: 12 },
  previewTag:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewTagText:     { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: ORANGE, letterSpacing: 0.8 },
  previewQuestion:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: '#111', lineHeight: 25 },
  previewOpt:         { flexDirection: 'row', alignItems: 'center', borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0F0F0', height: 42, position: 'relative' },
  previewOptBar:      { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: ORANGE + '28', borderRadius: 12 },
  previewOptText:     { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: '#111', paddingLeft: 14, flex: 1 },
  previewOptPct:      { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: ORANGE, paddingRight: 14 },
});
