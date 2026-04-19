import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ArtistOfTheDayProps {
  name: string;
  avatarUrl: string;
  streakWeeks: number;
  discipline: string;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');

export default function ArtistOfTheDay({ name, avatarUrl, streakWeeks, discipline, onPress }: ArtistOfTheDayProps) {
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress();
  };

  return (
    <View style={styles.outerContainer}>
      <Text style={styles.sectionTitle}>In Evidenza</Text>
      
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
        <Image source={{ uri: avatarUrl }} style={styles.heroImage} resizeMode="cover" />
        
        <View style={styles.contentOverlay}>
          <View style={styles.badgeRow}>
             <Text style={styles.badgeText}>ARTISTA DEL GIORNO</Text>
          </View>
          
          <Text style={styles.artistName}>{name}</Text>
          <Text style={styles.disciplineText}>{discipline}</Text>

          <View style={styles.streakPill}>
            <Text style={styles.streakLabel}>STREAK:</Text>
            <Text style={styles.streakNumber}>{streakWeeks} SETTIMANE</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 0,
    marginVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 20,
    marginBottom: 12,
  },
  container: {
    width: width,
    height: 400, // Immagine molto grande stile Vogue/Editoriale
    backgroundColor: '#FAFAFA',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Sfondo bianco molto pulito staccato dall'immagine
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  badgeRow: {
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: '#000000',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  artistName: {
    fontFamily: 'PlusJakartaSans_400Regular', // Font molto più pulito e meno pesante
    fontSize: 32,
    color: '#000000',
    letterSpacing: -1,
    marginBottom: 4,
  },
  disciplineText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
  },
  streakPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  streakLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: '#888888',
    marginRight: 6,
  },
  streakNumber: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#000000',
  },
});
