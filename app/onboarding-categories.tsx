import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, FlatList, Image, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_SPACING = 12;
const CARD_WIDTH = (width - 40 - COLUMN_SPACING) / 2;
const MIN_SELECTIONS = 3;

const CATEGORIES = [
  { id: '1', title: 'Pittura', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80', fallbackColor: '#E8A87C', icon: { lib: 'MaterialCommunityIcons', name: 'palette' } },
  { id: '2', title: 'Scultura', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80', fallbackColor: '#B5C4B1', icon: { lib: 'FontAwesome5', name: 'drafting-compass' } },
  { id: '3', title: 'Disegno', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80', fallbackColor: '#A8C5DA', icon: { lib: 'MaterialCommunityIcons', name: 'pencil' } },
  { id: '4', title: 'Fotografia', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80', fallbackColor: '#2C3E50', icon: { lib: 'Ionicons', name: 'camera' } },
  { id: '5', title: 'Arte digitale', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80', fallbackColor: '#6C5CE7', icon: { lib: 'Ionicons', name: 'tablet-landscape' } },
  { id: '6', title: 'Street Art', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', fallbackColor: '#E17055', icon: { lib: 'MaterialCommunityIcons', name: 'spray' } },
  { id: '7', title: 'Illustrazione', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80', fallbackColor: '#FDCB6E', icon: { lib: 'MaterialCommunityIcons', name: 'book-open-variant' } },
  { id: '8', title: 'Grafica', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80', fallbackColor: '#0984E3', icon: { lib: 'MaterialCommunityIcons', name: 'vector-square' } },
  { id: '9', title: 'Arte astratta', image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80', fallbackColor: '#A29BFE', icon: { lib: 'MaterialCommunityIcons', name: 'shape' } },
  { id: '10', title: 'Arte figurativa', image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80', fallbackColor: '#74B9FF', icon: { lib: 'Ionicons', name: 'person' } },
  { id: '11', title: 'Arte concettuale', image: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&q=80', fallbackColor: '#55EFC4', icon: { lib: 'Ionicons', name: 'bulb' } },
  { id: '12', title: 'Arte contemporanea', image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80', fallbackColor: '#636E72', icon: { lib: 'MaterialCommunityIcons', name: 'bank' } },
  { id: '13', title: 'Arte classica', image: 'https://images.unsplash.com/photo-1564457461758-8ff96e439e83?w=600&q=80', fallbackColor: '#D4A373', icon: { lib: 'FontAwesome5', name: 'monument' } },
  { id: '14', title: 'Arte tessile', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80', fallbackColor: '#FAB1A0', icon: { lib: 'MaterialCommunityIcons', name: 'needle' } },
  { id: '15', title: 'Calligrafia', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', fallbackColor: '#2D3436', icon: { lib: 'MaterialCommunityIcons', name: 'pen' } },
  { id: '16', title: 'Moda / Fashion', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', fallbackColor: '#E84393', icon: { lib: 'MaterialCommunityIcons', name: 'hanger' } },
  { id: '17', title: 'Sponsor', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80', fallbackColor: '#F39C12', icon: { lib: 'Ionicons', name: 'megaphone' } },
];

function CategoryIcon({ lib, name, size, color }: { lib: string; name: string; size: number; color: string }) {
  if (lib === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
  if (lib === 'FontAwesome5') return <FontAwesome5 name={name as any} size={size} color={color} />;
  return <Ionicons name={name as any} size={size} color={color} />;
}

function CategoryCard({ item, selected, onPress }: { item: typeof CATEGORIES[0]; selected: boolean; onPress: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
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
          { backgroundColor: item.fallbackColor },
          selected && styles.cardSelected,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFillObject} />
        {selected && <View style={styles.selectedOverlay} />}
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.labelContainer}>
          <View style={styles.iconCircle}>
            <CategoryIcon lib={item.icon.lib} name={item.icon.name} size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function OnboardingCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const canProceed = selectedIds.length >= MIN_SELECTIONS;

  const handleContinue = async () => {
    if (!canProceed) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (dbUser) {
          const selectedTitles = CATEGORIES
            .filter(c => selectedIds.includes(c.id))
            .map(c => c.title);
          await supabase.from('users')
            .update({ categories: selectedTitles })
            .eq('id', dbUser.id);
        }
      }
    } catch { /* non bloccare il flusso */ }
    router.push('/onboarding-role');
  };

  const btnOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const onBtnPressIn = () => {
    if (!canProceed) return;
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.header}>
        <Text style={styles.title}>Le tue passioni</Text>
        <Text style={styles.subtitle}>
          Scegli <Text style={styles.subtitleAccent}>almeno 3 categorie</Text> che ami
        </Text>
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={({ item }) => (
          <CategoryCard
            item={item}
            selected={selectedIds.includes(item.id)}
            onPress={() => toggleSelection(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
      />

      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPressIn={onBtnPressIn} onPressOut={onBtnPressOut} onPress={handleContinue}>
          <Animated.View
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
              { opacity: btnOpacity, transform: [{ scale: btnScale }] },
            ]}
          >
            <Text style={styles.nextButtonText}>
              {canProceed ? 'Continua' : `Seleziona ancora ${MIN_SELECTIONS - selectedIds.length}`}
            </Text>
            {canProceed && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />}
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
    paddingBottom: 20,
    alignItems: 'center',
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
  },
  subtitleAccent: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#F07B1D',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.25,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: '#F07B1D',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240, 123, 29, 0.28)',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#F07B1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    flexShrink: 1,
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
