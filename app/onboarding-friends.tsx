import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import AvatarImg from '../components/AvatarImg';

const ORANGE = '#F07B1D';

interface RealUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  discipline: string | null;
  role: string | null;
}

function UserCard({ item, isAdded, onToggle }: { item: RealUser; isAdded: boolean; onToggle: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  const isOfficial = item.role === 'official' || item.role === 'admin';

  return (
    <View style={styles.userCard}>
      <AvatarImg uri={item.avatar_url} size={48} />
      <View style={styles.userInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {item.name || item.username}
          </Text>
          {isOfficial && (
            <Ionicons name="checkmark-circle" size={14} color="#007AFF" />
          )}
        </View>
        <Text style={styles.userRole} numberOfLines={1} ellipsizeMode="tail">
          {item.discipline || 'Artista'}
        </Text>
      </View>
      <Pressable onPress={onToggle} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View style={[styles.actionButton, isAdded && styles.actionButtonAdded, { opacity }]}>
          {isAdded ? (
            <Text style={[styles.actionButtonText, styles.actionButtonTextAdded]}>Inviata</Text>
          ) : (
            <>
              <Ionicons name="person-add" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Segui</Text>
            </>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function OnboardingFriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addedFriends, setAddedFriends] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<RealUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let myId: string | null = null;
        if (user) {
          const { data: me } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
          myId = me?.id ?? null;
          setCurrentUserId(myId);
        }

        const { data } = await supabase
          .from('users')
          .select('id, name, username, avatar_url, discipline, role')
          .order('created_at', { ascending: false })
          .limit(30);

        if (data) {
          // Escludi l'utente corrente
          setUsers(data.filter((u: RealUser) => u.id !== myId));
        }
      } catch {
        // ignora errori
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFriend = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasAdded = !!addedFriends[id];
    setAddedFriends(prev => ({ ...prev, [id]: !wasAdded }));
    if (!wasAdded && currentUserId) {
      supabase.from('follows').insert({ follower_id: currentUserId, following_id: id }).then(() => {});
    } else if (wasAdded && currentUserId) {
      supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', id).then(() => {});
    }
  };

  const btnOpacity = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <View style={styles.header}>
        <Text style={styles.title}>Trova amici</Text>
        <Text style={styles.subtitle}>
          Connettiti con persone che condividono le tue{' '}
          <Text style={styles.subtitleAccent}>stesse passioni</Text>.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          renderItem={({ item }) => (
            <UserCard
              item={item}
              isAdded={!!addedFriends[item.id]}
              onToggle={() => toggleFriend(item.id)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', color: '#AAA', fontSize: 14 }}>
                Nessun altro utente ancora
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPressIn={onBtnPressIn} onPressOut={onBtnPressOut} onPress={() => router.replace('/home')}>
          <Animated.View style={[styles.nextButton, { opacity: btnOpacity, transform: [{ scale: btnScale }] }]}>
            <Text style={styles.nextButtonText}>Continua</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  title: { fontFamily: 'Poppins_800ExtraBold', fontSize: 34, color: '#111111', letterSpacing: -0.3, lineHeight: 41 },
  subtitle: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#666666', marginTop: 8, lineHeight: 22 },
  subtitleAccent: { fontFamily: 'PlusJakartaSans_700Bold', color: ORANGE },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  userCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  userInfo: { flex: 1 },
  userName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: '#111' },
  userRole: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#888', marginTop: 2 },
  actionButton: { backgroundColor: ORANGE, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  actionButtonAdded: { backgroundColor: '#F0F0F0' },
  actionButtonText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff' },
  actionButtonTextAdded: { color: '#888' },
  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  nextButton: { backgroundColor: ORANGE, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { fontFamily: 'Poppins_800ExtraBold', fontSize: 16, color: '#FFFFFF' },
});
