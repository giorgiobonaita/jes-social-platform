/**
 * MediaPickerModal — galleria custom con fotocamera come prima cella.
 * Supporta selezione singola o multipla.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  Image, SafeAreaView, Alert, Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';
const CELL = (SW - 3) / 3; // 3 colonne con 1px di gap

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (uris: string[]) => void;
  multiple?: boolean; // default false
}

export default function MediaPickerModal({ visible, onClose, onSelect, multiple = false }: Props) {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Reset quando si apre
  useEffect(() => {
    if (visible) {
      setSelected([]);
      setPhotos([]);
      setHasNextPage(true);
      setEndCursor(undefined);
      requestPermissionAndLoad();
    }
  }, [visible]);

  const requestPermissionAndLoad = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Accesso necessario',
        'Per scegliere le foto vai in Impostazioni e consenti l\'accesso alla galleria.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }
    setPermissionGranted(true);
    loadPhotos();
  };

  const loadPhotos = useCallback(async (cursor?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const page = await MediaLibrary.getAssetsAsync({
        first: 60,
        after: cursor,
        mediaType: 'photo',
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      setPhotos(prev => cursor ? [...prev, ...page.assets] : page.assets);
      setHasNextPage(page.hasNextPage);
      setEndCursor(page.endCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Accesso necessario', 'Consenti l\'accesso alla fotocamera nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      onSelect([result.assets[0].uri]);
    }
  };

  const toggleSelect = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!multiple) {
      onSelect([uri]);
      return;
    }
    setSelected(prev =>
      prev.includes(uri) ? prev.filter(u => u !== uri) : [...prev, uri]
    );
  };

  const confirm = () => {
    if (selected.length === 0) return;
    onSelect(selected);
  };

  // Dati: prima cella = fotocamera, poi foto
  const data: Array<{ type: 'camera' } | MediaLibrary.Asset> = [
    { type: 'camera' },
    ...photos,
  ];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (item.type === 'camera') {
      return (
        <TouchableOpacity style={styles.cameraCell} onPress={openCamera} activeOpacity={0.8}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.cameraCellText}>Fotocamera</Text>
        </TouchableOpacity>
      );
    }

    const uri = item.uri;
    const selIdx = selected.indexOf(uri);
    const isSelected = selIdx !== -1;

    return (
      <TouchableOpacity style={styles.photoCell} onPress={() => toggleSelect(uri)} activeOpacity={0.85}>
        <Image source={{ uri }} style={styles.photo} />
        {multiple && (
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && (
              <Text style={styles.checkboxNum}>{selIdx + 1}</Text>
            )}
          </View>
        )}
        {isSelected && <View style={styles.selectedOverlay} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scegli foto</Text>
          {multiple && selected.length > 0 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={confirm} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Avanti ({selected.length})</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* Griglia */}
        {permissionGranted ? (
          <FlatList
            data={data}
            keyExtractor={(item, i) => (item as any).type === 'camera' ? 'camera' : (item as MediaLibrary.Asset).id}
            renderItem={renderItem}
            numColumns={3}
            ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
            columnWrapperStyle={{ gap: 1.5 }}
            onEndReached={() => hasNextPage && !loading && loadPhotos(endCursor)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} color={ORANGE} /> : null}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerLoad}>
            <ActivityIndicator color={ORANGE} size="large" />
            <Text style={styles.loadingText}>Caricamento galleria...</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  closeBtn:       { width: 40 },
  headerTitle:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#111' },
  nextBtn:        { backgroundColor: ORANGE, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22 },
  nextBtnText:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#fff' },

  cameraCell:     { width: CELL, height: CELL, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', gap: 6 },
  cameraCellText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#fff' },

  photoCell:      { width: CELL, height: CELL, position: 'relative' },
  photo:          { width: '100%', height: '100%' },
  selectedOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(240,123,29,0.25)' },
  checkbox:       { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff', backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkboxNum:    { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#fff' },

  centerLoad:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:    { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: '#AAA' },
});
