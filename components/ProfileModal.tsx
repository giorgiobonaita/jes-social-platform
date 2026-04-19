import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase, JES_OFFICIAL_USERNAME } from '../lib/supabase';
import AdminPanelModal from './AdminPanelModal';
const JES_ICON = require('../assets/images/icon.png');
import SinglePostModal from './SinglePostModal';
import CommentsModal from './CommentsModal';

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

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';
const GRID_SIZE = (SW - 4) / 3;


const LINK_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*\.(?:com|it|net|org|io|co|uk|de|fr|es|eu|app|dev|me|info|biz|edu)(?:\/[^\s]*)?)/g;

function parseLinks(text: string): Array<{ text: string; isUrl: boolean }> {
  const result: Array<{ text: string; isUrl: boolean }> = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) result.push({ text: text.slice(lastIndex, match.index), isUrl: false });
    result.push({ text: match[0], isUrl: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) result.push({ text: text.slice(lastIndex), isUrl: false });
  return result;
}

// ─── VOCI IMPOSTAZIONI ───────────────────────────────────────────────────────
const SETTINGS: { id: string; icon: string; label: string; danger?: boolean }[] = [
  { id: 's1', icon: 'person-outline',        label: 'Modifica profilo' },
  { id: 's2', icon: 'notifications-outline', label: 'Notifiche' },
  { id: 's5', icon: 'help-circle-outline',   label: 'Assistenza' },
  { id: 's6', icon: 'document-text-outline', label: 'Terms & Privacy' },
];

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId?: string;
  onMessagePress?: (userId: string, name: string, avatarUrl: string | null) => void;
  onRequestViewUser?: (userId: string) => void;
  onPostAsJes?: (jesUserId: string, type: 'post' | 'story') => void;
}

type TabType = 'posts' | 'followers' | 'seguiti';

export default function ProfileModal({ visible, onClose, targetUserId, onMessagePress, onRequestViewUser, onPostAsJes }: ProfileModalProps) {
  const isOwnProfile = !targetUserId;
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsScreen, setSettingsScreen] = useState<null | 'notifiche' | 'privacy' | 'aspetto'>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [gridViewerUrl, setGridViewerUrl] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false); // se lui segue me
  const [myDbId, setMyDbId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const router = useRouter();

  // Profilo reale da Supabase
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    discipline: string | null;
    role: string | null;
  } | null>(null);
  const [gridPosts, setGridPosts] = useState<{ id: string; url: string }[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);

  // Stato edit profile
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (!profile) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Accesso necessario', 'Consenti l\'accesso alla galleria nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const uri = result.assets[0].uri;
      const ext      = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${profile.id}_${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;
      const base64   = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const byteArray = decodeBase64(base64);
      const { error } = await supabase.storage
        .from('media').upload(filePath, byteArray, { contentType: `image/${ext}`, upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from('media').getPublicUrl(filePath);
      const avatarUrl = data.publicUrl + `?t=${Date.now()}`;
      const { error: updateErr } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);
      if (updateErr) throw new Error(updateErr.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadProfile();
    } catch (e: any) {
      Alert.alert('Errore', e.message || 'Impossibile caricare la foto.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determina quale userId caricare
      let userId = targetUserId ?? null;
      let dbMyId: string | null = myDbId;
      if (!dbMyId) {
        const { data: me } = await supabase.from('users').select('id, role').eq('auth_id', user.id).single();
        dbMyId = me?.id ?? null;
        setMyDbId(dbMyId);
        setMyRole(me?.role ?? null);
      }
      if (!userId) userId = dbMyId; // profilo proprio

      if (!userId) return;

      const { data } = await supabase
        .from('users')
        .select('id, name, username, bio, avatar_url, discipline, role, phone')
        .eq('id', userId)
        .single();
      if (data) {
        setProfile({ id: data.id, name: data.name, username: data.username, bio: data.bio, avatarUrl: data.avatar_url, discipline: data.discipline, role: data.role ?? null });
        if (isOwnProfile) {
          setEditName(data.name || '');
          setEditUsername(data.username || '');
          setEditBio(data.bio || '');
          setEditPhone(data.phone || '');
        }

        // Carica post dell'utente
        const { data: posts } = await supabase
          .from('posts')
          .select('id, image_url, image_urls, views_count')
          .eq('user_id', data.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (posts) {
          setGridPosts(posts.map((p: any) => {
            const url = (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || '';
            return { id: p.id, url };
          }).filter((p: any) => p.url));
          setTotalViews(posts.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0));
        }

        // Conta follower, seguiti e like totali ricevuti
        const [{ count: followers }, { count: following }] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', data.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.id),
        ]);
        setFollowersCount(followers ?? 0);
        setFollowingCount(following ?? 0);

        // Conta i like totali su tutti i post dell'utente
        const postIds = posts?.map((p: any) => p.id) ?? [];
        if (postIds.length > 0) {
          const { count: likesTotal } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds);
          setTotalLikes(likesTotal ?? 0);
        } else {
          setTotalLikes(0);
        }

        // Controlla se lo sto già seguendo (solo quando guardo un altro) e se lui segue me
        if (!isOwnProfile && dbMyId) {
          const { data: followRow } = await supabase
            .from('follows').select('id')
            .eq('follower_id', dbMyId).eq('following_id', data.id)
            .maybeSingle();
          setIsFollowing(!!followRow);
          
          const { data: followerRow } = await supabase
            .from('follows').select('id')
            .eq('follower_id', data.id).eq('following_id', dbMyId)
            .maybeSingle();
          setIsFollower(!!followerRow);
        }
      }
    } finally {
      setLoadingProfile(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  useEffect(() => {
    if (visible) { setListsLoaded(false); setActiveTab('posts'); loadProfile(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, targetUserId]);

  const loadFollowersFollowing = useCallback(async () => {
    if (listsLoaded || !profile) return;
    setListsLoaded(true);
    const [{ data: frRows }, { data: fngRows }] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('following_id', profile.id).limit(100),
      supabase.from('follows').select('following_id').eq('follower_id', profile.id).limit(100),
    ]);
    const frIds = (frRows || []).map((r: any) => r.follower_id);
    const fngIds = (fngRows || []).map((r: any) => r.following_id);
    const [{ data: frUsers }, { data: fngUsers }] = await Promise.all([
      frIds.length > 0 ? supabase.from('users').select('id, name, username, avatar_url').in('id', frIds) : Promise.resolve({ data: [] as any[] }),
      fngIds.length > 0 ? supabase.from('users').select('id, name, username, avatar_url').in('id', fngIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    setFollowersList(frUsers || []);
    setFollowingList(fngUsers || []);
  }, [listsLoaded, profile]);

  useEffect(() => {
    if (activeTab === 'followers' || activeTab === 'seguiti') loadFollowersFollowing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Stato notifiche
  const [notifLike, setNotifLike] = useState(true);
  const [notifFollower, setNotifFollower] = useState(true);
  const [notifMessaggi, setNotifMessaggi] = useState(true);
  const [notifStorie, setNotifStorie] = useState(true);
  const [notifMenzioni, setNotifMenzioni] = useState(true);

  // Stato privacy
  const [accountPrivato, setAccountPrivato] = useState(false);
  const [mostraAttivita, setMostraAttivita] = useState(true);
  const [allowTags, setAllowTags] = useState(true);
  const [tema, setTema] = useState<'chiaro' | 'scuro' | 'sistema'>('chiaro');

  const toggleFollow = async () => {
    if (!myDbId || !profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(c => Math.max(0, c - 1));
      await supabase.from('follows').delete().eq('follower_id', myDbId).eq('following_id', profile.id);
    } else {
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
      await supabase.from('follows').insert({ follower_id: myDbId, following_id: profile.id });
      await supabase.from('notifications').insert({ user_id: profile.id, sender_id: myDbId, type: 'follow' });
    }
  };

  const formatNum = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const handleSettingPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 's1') {
      setShowSettings(false);
      setTimeout(() => setShowEditProfile(true), 200);
    } else if (id === 's2') {
      setSettingsScreen('notifiche');
    } else if (id === 's5') {
      Linking.openURL('mailto:jes.socialdelleemozioni@gmail.com');
    } else if (id === 's6') {
      router.push('/terms');
    }
  };

  const goBackSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettingsScreen(null);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={settingsScreen ? goBackSettings : showSettings ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(false); setSettingsScreen(null); } : onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {settingsScreen === 'notifiche' ? 'Notifiche'
              : settingsScreen === 'aspetto' ? 'Aspetto'
              : showSettings ? 'Impostazioni'
              : isOwnProfile ? 'Profilo' : (profile?.username ? `@${profile.username}` : 'Profilo')}
          </Text>
          {isOwnProfile && !settingsScreen && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSettingsScreen(null); setShowSettings(s => !s); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name={showSettings ? 'close' : 'settings-outline'} size={24} color="#111" />
            </TouchableOpacity>
          )}
          {!isOwnProfile && !showSettings && profile?.username !== JES_OFFICIAL_USERNAME && (
            <TouchableOpacity
              style={[styles.followHeaderBtn, isFollowing && styles.followHeaderBtnActive]}
              onPress={toggleFollow}
              activeOpacity={0.85}
            >
              <Text style={[styles.followHeaderBtnText, isFollowing && styles.followHeaderBtnTextActive]}>
                {isFollowing ? 'Segue' : 'Segui'}
              </Text>
            </TouchableOpacity>
          )}
          {(isOwnProfile && settingsScreen) && <View style={{ width: 26 }} />}
        </View>

        {showSettings && settingsScreen === 'notifiche' ? (
          /* ── NOTIFICHE ── */
          <ScrollView contentContainerStyle={styles.settingsList}>
            <Text style={styles.subSectionLabel}>PUSH NOTIFICATION</Text>
            {[
              { label: 'Like e commenti', value: notifLike, setter: setNotifLike },
              { label: 'Nuovi follower', value: notifFollower, setter: setNotifFollower },
              { label: 'Messaggi diretti', value: notifMessaggi, setter: setNotifMessaggi },
              { label: 'Storie', value: notifStorie, setter: setNotifStorie },
              { label: 'Menzioni', value: notifMenzioni, setter: setNotifMenzioni },
            ].map(row => (
              <View key={row.label} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{row.label}</Text>
                <Switch
                  value={row.value}
                  onValueChange={v => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); row.setter(v); }}
                  trackColor={{ false: '#E0E0E0', true: ORANGE }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </ScrollView>

        ) : showSettings && settingsScreen === 'aspetto' ? (
          /* ── ASPETTO ── */
          <ScrollView contentContainerStyle={styles.settingsList}>
            <Text style={styles.subSectionLabel}>TEMA</Text>
            {([
              { key: 'chiaro', label: 'Tema chiaro', icon: 'sunny-outline' },
              { key: 'scuro',  label: 'Tema scuro',  icon: 'moon-outline' },
              { key: 'sistema', label: 'Segui sistema', icon: 'phone-portrait-outline' },
            ] as { key: 'chiaro' | 'scuro' | 'sistema'; label: string; icon: string }[]).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTema(opt.key); }}
              >
                <View style={styles.settingIconWrap}>
                  <Ionicons name={opt.icon as any} size={20} color={ORANGE} />
                </View>
                <Text style={styles.settingLabel}>{opt.label}</Text>
                {tema === opt.key && <Ionicons name="checkmark" size={20} color={ORANGE} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

        ) : showSettings ? (
          /* ── LISTA IMPOSTAZIONI ── */
          <ScrollView contentContainerStyle={styles.settingsList}>
            {SETTINGS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={() => handleSettingPress(item.id)}
              >
                <View style={[styles.settingIconWrap, item.danger && styles.settingIconDanger]}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.danger ? '#FF3B30' : ORANGE}
                  />
                </View>
                <Text style={[styles.settingLabel, item.danger && styles.settingLabelDanger]}>
                  {item.label}
                </Text>
                {!item.danger && (
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                )}
              </TouchableOpacity>
            ))}
            {/* ESCI e ADMIN PANEL in fondo */}
            {myRole === 'admin' && (
              <>
                <Text style={[styles.subSectionLabel, { marginTop: 24 }]}>SEZIONE ADMIN</Text>
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.7}
                  onPress={() => { setShowAdminPanel(true); }}
                >
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="shield-checkmark" size={20} color={ORANGE} />
                  </View>
                  <Text style={styles.settingLabel}>Pannello Admin</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.7}
                  onPress={async () => {
                    const { data } = await supabase
                      .from('users').select('id').eq('username', JES_OFFICIAL_USERNAME).maybeSingle();
                    if (data && onRequestViewUser) {
                      setShowSettings(false);
                      onRequestViewUser(data.id);
                    } else {
                      Alert.alert('Account JES non trovato', `Crea prima l\'utente con username "${JES_OFFICIAL_USERNAME}" in Supabase.`);
                    }
                  }}
                >
                  <View style={styles.settingIconWrap}>
                    <Ionicons name="star" size={20} color={ORANGE} />
                  </View>
                  <Text style={styles.settingLabel}>Profilo ufficiale JES</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.settingRow, { marginTop: 20 }]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Esci dall\'account',
                  'Sei sicuro di voler uscire?',
                  [
                    { text: 'Annulla', style: 'cancel' },
                    {
                      text: 'Esci',
                      style: 'destructive',
                      onPress: async () => {
                        await supabase.auth.signOut();
                        onClose();
                        setTimeout(() => router.replace('/'), 300);
                      },
                    },
                  ]
                );
              }}
            >
              <View style={[styles.settingIconWrap, styles.settingIconDanger]}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.settingLabel, styles.settingLabelDanger]}>Esci</Text>
            </TouchableOpacity>

            {/* CANCELLA ACCOUNT */}
            <TouchableOpacity
              style={[styles.settingRow, { marginTop: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  'Elimina account',
                  'Sei assolutamente sicuro di voler cancellare il tuo account e tutti i tuoi dati? Questa azione è IRREVERSIBILE.',
                  [
                    { text: 'Annulla', style: 'cancel' },
                    {
                      text: 'Elimina definitivamente',
                      style: 'destructive',
                      onPress: async () => {
                        if (!profile?.id) return;
                        // Eliminiamo il record public.users (che tramite CASCADE nel DB ripulirà post e roba varia)
                        // Per rimuoverlo anche dall'Auth di Supabase idealmente serve auth.admin o un handler edge.
                        // Ma per ora elimina il profilo pubblico e butta l'utente fuori!
                        await supabase.from('users').delete().eq('id', profile.id);
                        await supabase.auth.signOut();
                        onClose();
                        setTimeout(() => router.replace('/'), 300);
                      },
                    },
                  ]
                );
              }}
            >
              <View style={[styles.settingIconWrap, styles.settingIconDanger]}>
                <Ionicons name="trash-bin-outline" size={20} color="#FF3B30" />
              </View>
              <Text style={[styles.settingLabel, styles.settingLabelDanger]}>Elimina Account</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* ── SCHERMATA PROFILO ── */
          <ScrollView showsVerticalScrollIndicator={false}>
            {loadingProfile ? (
              <ActivityIndicator color={ORANGE} style={{ marginTop: 60 }} />
            ) : (
            <>
            {/* Avatar + stats */}
            {(() => {
              const isJes = profile?.username === JES_OFFICIAL_USERNAME;
              const displayFollowers = isJes ? Math.max(followersCount, 1300) : followersCount;
              return (
              <View style={styles.topSection}>
              <View style={styles.topSectionRow}>
                <View style={styles.avatarWrap}>
                  {isJes ? (
                    <TouchableOpacity
                      activeOpacity={myRole === 'admin' ? 0.75 : 1}
                      onPress={() => { if (myRole === 'admin') handlePickAvatar(); }}
                    >
                      <Image source={profile?.avatarUrl ? { uri: profile.avatarUrl } : JES_ICON} style={styles.avatar} />
                      {myRole === 'admin' && (
                        <View style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: ORANGE, borderRadius: 12, padding: 5 }}>
                          <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : isOwnProfile ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handlePickAvatar}
                    >
                      {profile?.avatarUrl ? (
                        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="person" size={40} color="#CCC" />
                        </View>
                      )}
                      <View style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: ORANGE, borderRadius: 12, padding: 5 }}>
                        <Ionicons name="camera" size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  ) : profile?.avatarUrl ? (
                    <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={40} color="#CCC" />
                    </View>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statNum, { fontSize: 17 }]}>{gridPosts.length}</Text>
                    <Text style={styles.statLabel}>Post</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statNum, { fontSize: 17 }]}>{formatNum(totalViews)}</Text>
                    <Text style={styles.statLabel}>Visual</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statNum, { fontSize: 17 }]}>{formatNum(displayFollowers)}</Text>
                    <Text style={styles.statLabel}>Follower</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statNum, { fontSize: 17 }]}>{followingCount}</Text>
                    <Text style={styles.statLabel}>Seguiti</Text>
                  </View>
                </View>
              </View>

                {/* Like totali — ben visibili vicino al cuore */}
                <View style={styles.likesStatRow}>
                  <Ionicons name="heart" size={18} color={ORANGE} />
                  <Text style={styles.likesStatNum}>{formatNum(totalLikes)}</Text>
                  <Text style={styles.likesStatLabel}>like totali</Text>
                </View>
              </View>
              );
            })()}

            {/* Nome + bio */}
            <View style={styles.infoSection}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile?.name || 'Utente'}</Text>
                {profile?.username === JES_OFFICIAL_USERNAME && (
                  <Ionicons name="checkmark-circle" size={20} color={ORANGE} style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.username}>@{profile?.username || ''}</Text>
              {profile?.bio ? (
                <Text style={styles.bio}>
                  {parseLinks(profile.bio).map((part, i) =>
                    part.isUrl ? (
                      <Text key={i} style={[styles.bio, { color: ORANGE, textDecorationLine: 'underline' }]}
                        onPress={() => {
                          const url = part.text.startsWith('http') ? part.text : `https://${part.text}`;
                          Linking.openURL(url).catch(() => {});
                        }}>
                        {part.text}
                      </Text>
                    ) : (
                      <Text key={i}>{part.text}</Text>
                    )
                  )}
                </Text>
              ) : null}
              {profile?.discipline ? (
                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{profile.discipline}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Bottone modifica (solo profilo proprio) */}
            {isOwnProfile && (
              <View style={styles.editBtnWrap}>
                <TouchableOpacity
                  style={styles.editBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowEditProfile(true);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#111" />
                  <Text style={styles.editBtnText}>Modifica profilo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Condividi profilo', `jes.app/@${profile?.username || ''}`, [{ text: 'OK' }]);
                  }}
                >
                  <Ionicons name="share-social-outline" size={18} color="#111" />
                </TouchableOpacity>
              </View>
            )}

            {/* Azioni profilo altrui */}
            {!isOwnProfile && profile && profile.username !== JES_OFFICIAL_USERNAME && onMessagePress && (
              <View style={styles.editBtnWrap}>
                <TouchableOpacity
                  style={[styles.editBtn, { flex: 1, justifyContent: 'center' }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onMessagePress(profile.id, profile.name || profile.username, profile.avatarUrl);
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={16} color="#111" />
                  <Text style={styles.editBtnText}>Scrivi messaggio</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pulsante "Pubblica come JES" — solo admin */}
            {!isOwnProfile && profile?.username === JES_OFFICIAL_USERNAME && myRole === 'admin' && (
              <View style={styles.editBtnWrap}>
                <TouchableOpacity
                  style={[styles.editBtn, { flex: 1, justifyContent: 'center', borderColor: ORANGE }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert('Pubblica come JES', 'Cosa vuoi pubblicare?', [
                      { text: 'Post', onPress: () => onPostAsJes?.(profile.id, 'post') },
                      { text: 'Storia', onPress: () => onPostAsJes?.(profile.id, 'story') },
                      { text: 'Annulla', style: 'cancel' },
                    ]);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={ORANGE} />
                  <Text style={[styles.editBtnText, { color: ORANGE }]}>Pubblica come JES</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tab bar — 3 sezioni */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('posts'); }}
              >
                <Ionicons name="grid-outline" size={22} color={activeTab === 'posts' ? ORANGE : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('followers'); }}
              >
                <Ionicons name="people-outline" size={22} color={activeTab === 'followers' ? ORANGE : '#AAA'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'seguiti' && styles.tabActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('seguiti'); }}
              >
                <Ionicons name="person-add-outline" size={22} color={activeTab === 'seguiti' ? ORANGE : '#AAA'} />
              </TouchableOpacity>
            </View>

            {/* Label Visual sopra la griglia */}
            {activeTab === 'posts' && gridPosts.length > 0 && (
              <View style={styles.visualLabelRow}>
                <Ionicons name="images-outline" size={13} color={ORANGE} />
                <Text style={styles.visualLabelText}>Visual</Text>
              </View>
            )}

            {/* Contenuto tab */}
            {activeTab === 'posts' && (
              gridPosts.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="images-outline" size={48} color="#DDD" />
                  <Text style={styles.emptyText}>Nessun post ancora</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {gridPosts.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPostId(post.id);
                      }}
                    >
                      <Image source={{ uri: post.url }} style={styles.gridImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
            {(activeTab === 'followers' || activeTab === 'seguiti') && (
              !listsLoaded ? (
                <ActivityIndicator color={ORANGE} style={{ marginTop: 40 }} />
              ) : (activeTab === 'followers' ? followersList : followingList).length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="people-outline" size={48} color="#DDD" />
                  <Text style={styles.emptyText}>{activeTab === 'followers' ? 'Nessun follower ancora' : 'Non segue ancora nessuno'}</Text>
                </View>
              ) : (
                <View>
                  {(activeTab === 'followers' ? followersList : followingList).map((u: any) => (
                    <TouchableOpacity
                      key={u.id}
                      style={styles.userRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (onRequestViewUser) { onClose(); setTimeout(() => onRequestViewUser(u.id), 200); }
                      }}
                    >
                      {u.avatar_url
                        ? <Image source={{ uri: u.avatar_url }} style={styles.userRowAvatar} />
                        : <View style={[styles.userRowAvatar, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={20} color="#CCC" /></View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userRowName}>{u.name || u.username}</Text>
                        <Text style={styles.userRowUsername}>@{u.username}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}

            <View style={{ height: 40 }} />
            </>
          )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ── MODIFICA PROFILO ── */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.editCancelText}>Annulla</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Modifica profilo</Text>
              <TouchableOpacity
                onPress={async () => {
                  if (!profile || savingProfile) return;
                  setSavingProfile(true);
                  const { error } = await supabase
                    .from('users')
                    .update({ name: editName.trim(), username: editUsername.trim().replace('@', ''), bio: editBio.trim(), phone: editPhone.trim() || null })
                    .eq('id', profile.id);
                  setSavingProfile(false);
                  if (error) {
                    Alert.alert('Errore', error.message);
                  } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await loadProfile();
                    setShowEditProfile(false);
                  }
                }}
              >
                {savingProfile
                  ? <ActivityIndicator color={ORANGE} />
                  : <Text style={styles.editSaveText}>Salva</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editScroll}>
              {/* Avatar */}
              <View style={styles.editAvatarWrap}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.editAvatar} />
                ) : (
                  <View style={[styles.editAvatar, { backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="person" size={40} color="#CCC" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editAvatarBtn}
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="camera" size={18} color="#fff" />
                  }
                </TouchableOpacity>
              </View>

              {/* Nome */}
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Nome completo</Text>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Il tuo nome"
                  placeholderTextColor="#CCC"
                />
              </View>

              {/* Username */}
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Username</Text>
                <TextInput
                  style={styles.editInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="@username"
                  placeholderTextColor="#CCC"
                  autoCapitalize="none"
                />
              </View>

              {/* Bio */}
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Bio</Text>
                <TextInput
                  style={[styles.editInput, styles.editInputMulti]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Raccontati in poche parole..."
                  placeholderTextColor="#CCC"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Telefono (opzionale) */}
              <View style={styles.editField}>
                <Text style={styles.editFieldLabel}>Telefono <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: '#AAA' }}>(opzionale)</Text></Text>
                <TextInput
                  style={styles.editInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+39 000 000 0000"
                  placeholderTextColor="#CCC"
                  keyboardType="phone-pad"
                  maxLength={20}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── VIEWER SINGOLO POST GRIGLIA ── */}
      <SinglePostModal
        visible={selectedPostId !== null}
        onClose={() => setSelectedPostId(null)}
        postId={selectedPostId}
        currentUserId={myDbId}
        isAdmin={myRole === 'admin'}
        onImagePress={(url) => setGridViewerUrl(url)}
        onCommentPress={(id) => {
          setCommentsPostId(id);
          setCommentsVisible(true);
        }}
      />
      
      <Modal
        visible={gridViewerUrl !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setGridViewerUrl(null)}
      >
        <View style={styles.imgViewerOverlay}>
          <TouchableOpacity
            style={styles.imgViewerClose}
            onPress={() => setGridViewerUrl(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {gridViewerUrl && (
            <Image source={{ uri: gridViewerUrl }} style={styles.imgViewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {commentsVisible && (
        <CommentsModal
          visible={commentsVisible}
          onClose={() => {
            setCommentsVisible(false);
            setCommentsPostId(null);
          }}
          postId={commentsPostId || ''}
        />
      )}

      <AdminPanelModal
        visible={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onUserPress={(userId) => { setShowAdminPanel(false); if (onRequestViewUser) onRequestViewUser(userId); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#111',
  },
  followHeaderBtn: {
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  followHeaderBtnActive: {
    backgroundColor: ORANGE,
  },
  followHeaderBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: ORANGE,
  },
  followHeaderBtnTextActive: {
    color: '#fff',
  },

  /* Top: avatar + stats */
  topSection: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  topSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: ORANGE,
    backgroundColor: '#EEE',
  },
  mutualBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  mutualBannerText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  streakText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBlock: {
    alignItems: 'center',
  },
  statNum: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#111',
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EEE',
  },

  /* Like totali nel profilo */
  likesStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#FFF0E6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  likesStatNum: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
    color: ORANGE,
  },
  likesStatLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#888',
  },

  /* Info */
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
    color: '#111',
  },
  username: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#888',
    marginTop: 1,
  },
  bio: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#FFF0E6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: ORANGE,
  },

  /* Bottone modifica */
  editBtnWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
  },
  editBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#111',
  },
  shareBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
  },

  /* Griglia */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridImage: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    backgroundColor: '#EEE',
  },

  /* Visual label */
  visualLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  visualLabelText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: ORANGE,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Lista utenti (follower / seguiti) */
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    gap: 12,
  },
  userRowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: ORANGE,
    backgroundColor: '#EEE',
  },
  userRowName: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: '#111',
  },
  userRowUsername: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#AAA',
    marginTop: 1,
  },

  /* Empty */
  emptyTab: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#AAA',
  },

  /* Settings */
  settingsList: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    gap: 14,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDanger: {
    backgroundColor: '#FFF0EE',
  },
  settingLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: '#111',
  },
  settingLabelDanger: {
    color: '#FF3B30',
  },
  subSectionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#AAA',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  toggleLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: '#111',
  },
  toggleSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    lineHeight: 16,
  },

  /* Edit Profile */
  editCancelText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: '#888' },
  editSaveText:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: ORANGE },
  editScroll:     { paddingHorizontal: 20, paddingBottom: 60 },
  editAvatarWrap: { alignItems: 'center', paddingVertical: 24, position: 'relative' },
  editAvatar:     { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEE' },
  editAvatarBtn:  { position: 'absolute', bottom: 28, right: '35%', width: 30, height: 30, borderRadius: 15, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  editField:      { marginBottom: 20 },
  editFieldLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  editInput:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, color: '#111', borderBottomWidth: 1.5, borderBottomColor: '#EEE', paddingVertical: 10, paddingHorizontal: 0 },
  editInputMulti: { minHeight: 70 },

  /* Image viewer */
  imgViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgViewerClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imgViewerImage: {
    width: SW,
    height: SW,
  },
});
