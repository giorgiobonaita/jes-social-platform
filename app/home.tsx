import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  StatusBar, Pressable, Image, ScrollView, Dimensions, Linking, Alert, Animated,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import PostCard from '../components/PostCard';
import FeedPoll from '../components/FeedPoll';
import StoryRing from '../components/StoryRing';
import StoryViewer, { UserStoryGroup } from '../components/StoryViewer';
import ImageViewerModal from '../components/ImageViewerModal';
import CommentsModal from '../components/CommentsModal';
import SearchModal from '../components/SearchModal';
import GroupsModal from '../components/GroupsModal';
import ChatModal from '../components/ChatModal';
import NotificationsModal from '../components/NotificationsModal';
import ProfileModal from '../components/ProfileModal';
import CreateMenuModal from '../components/CreateMenuModal';
import CreatePostModal from '../components/CreatePostModal';
import CreateStoryModal from '../components/CreateStoryModal';
import CreatePollModal from '../components/CreatePollModal';

const { width: SW } = Dimensions.get('window');
const ORANGE = '#F07B1D';

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  const d = Math.floor(h / 24);
  return `${d} g fa`;
}

// ─── TIPO STORIA ──────────────────────────────────────────────────────────────


const ADV_IMAGES = {
  adv1:   require('../assets/images/adv1.png'),
  adv2:   require('../assets/images/adv2.png'),
  adv3:   require('../assets/images/adv3.png'),
  gng1:   require('../assets/images/adv-gng1.png'),
  gng2:   require('../assets/images/adv-gng2.png'),
  gng3:   require('../assets/images/adv-gng3.png'),
  spidi1: require('../assets/images/adv-spidi1.png'),
  spidi2: require('../assets/images/adv-spidi2.png'),
  spidi3: require('../assets/images/adv-spidi3.png'),
};

const GNG_MAIL = 'mailto:mogildeag74@gmail.com';
const SPIDI_URL = 'https://www.facebook.com/profile.php?id=100077487938941';
const MERCURY_USERNAME = 'giuseppemercury';

const ADV_SPONSORS = [
  { imageSource: ADV_IMAGES.adv1,   url: 'https://www.gbsrl-studioimmobiliare.it/' },
  { imageSource: ADV_IMAGES.adv2,   url: 'https://gescompany.it/' },
  { imageSource: ADV_IMAGES.adv3,   url: 'https://www.mercury-auctions.com/it_it/index/' },
  { imageSource: ADV_IMAGES.gng1,   url: GNG_MAIL },
  { imageSource: ADV_IMAGES.gng2,   url: GNG_MAIL },
  { imageSource: ADV_IMAGES.gng3,   url: GNG_MAIL },
  { imageSource: ADV_IMAGES.spidi1, url: SPIDI_URL },
  { imageSource: ADV_IMAGES.spidi2, url: SPIDI_URL },
  { imageSource: ADV_IMAGES.spidi3, url: SPIDI_URL },
];

// @giuseppemercury posts pinned at every 4-post mark (slot 4, 8, 12…).
// When no mercury post is available, an ADV banner fills that slot.
// ADV banners are also injected at slot 2, 9, 16, 23… (every 7 after the first) for extra visibility.
function buildRealFeed(posts: any[]): any[] {
  const mercuryPosts = posts.filter(p => p.author?.username === MERCURY_USERNAME);
  const regularPosts = posts.filter(p => p.author?.username !== MERCURY_USERNAME);

  const feed: any[] = [];
  let mercuryIdx = 0;
  let advIdx = 0;

  // Sponsor banners rotate through ADV_SPONSORS
  const nextAdv = (tag: string) => {
    const s = ADV_SPONSORS[advIdx % ADV_SPONSORS.length];
    advIdx++;
    return { type: 'adv', id: `adv_${tag}_${advIdx}`, imageSource: s.imageSource, url: s.url };
  };

  for (let i = 0; i < regularPosts.length; i++) {
    feed.push(regularPosts[i]);

    // Slot 4, 8, 12… → mercury post (or ADV fallback)
    if ((i + 1) % 4 === 0) {
      if (mercuryIdx < mercuryPosts.length) {
        feed.push(mercuryPosts[mercuryIdx++]);
      } else {
        feed.push(nextAdv('m'));
      }
    }
    // Extra ADV at positions 1, 8, 15, 22… (every 7, offset 1)
    else if (i > 0 && (i - 1) % 7 === 0) {
      feed.push(nextAdv('r'));
    }
  }

  return feed;
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
export default function HomeFeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');

  // Modal opera

  // Storie
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyVisible, setStoryVisible] = useState(false);

  // Fullscreen immagine
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Commenti
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAuthorId, setCommentsAuthorId] = useState<string | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(false);

  // Modali header
  const [chatVisible, setChatVisible] = useState(false);
  const [chatOpenWith, setChatOpenWith] = useState<{ userId: string; name: string; avatar: string | null } | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [groupsVisible, setGroupsVisible] = useState(false);
  const [groupsInitialId, setGroupsInitialId] = useState<string | undefined>(undefined);
  const [notifVisible, setNotifVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [profileTargetUserId, setProfileTargetUserId] = useState<string | undefined>(undefined);

  // Crea contenuto
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [createStoryVisible, setCreateStoryVisible] = useState(false);
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const [jesPostAuthorId, setJesPostAuthorId] = useState<string | undefined>(undefined);
  const [jesStoryAuthorId, setJesStoryAuthorId] = useState<string | undefined>(undefined);

  // Scroll to top
  const flatListRef = useRef<any>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollVelocityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const velocity = Math.abs(y - lastScrollY.current);
    lastScrollY.current = y;

    // Mostra freccia quando si scrolla velocemente verso il basso (y > 300)
    if (velocity > 12 && y > 300) {
      if (!showScrollTop) {
        setShowScrollTop(true);
        Animated.timing(scrollTopOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
      if (scrollVelocityTimer.current) clearTimeout(scrollVelocityTimer.current);
      scrollVelocityTimer.current = setTimeout(() => {
        Animated.timing(scrollTopOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setShowScrollTop(false);
        });
      }, 2500);
    }

    // Nascondi se siamo in cima
    if (y < 100) {
      setShowScrollTop(false);
      Animated.timing(scrollTopOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  };

  // Post dai gruppi (appaiono nel feed)
  const [groupPosts, setGroupPosts] = useState<any[]>([]);

  // Post reali da Supabase
  const [dbPosts, setDbPosts] = useState<any[]>([]);

  // Storie reali da Supabase (raggruppate per utente)
  const [stories, setStories] = useState<UserStoryGroup[]>([]);

  // ID utente corrente nel DB (non auth_id) e Ruolo
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const allPosts = useMemo(() => [...groupPosts, ...dbPosts], [groupPosts, dbPosts]);
  const feedData = useMemo(() => buildRealFeed(allPosts), [allPosts]);

  // Carica l'id db e l'avatar dell'utente corrente
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id, avatar_url, role').eq('auth_id', user.id).single();
      if (data) {
        setCurrentUserId(data.id);
        setCurrentUserAvatar(data.avatar_url || null);
        setIsAdmin(data.role === 'admin');

        // Carica gli utenti che segui
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', data.id);
        setFollowingIds(new Set((followsData || []).map((f: any) => f.following_id)));

        // Controlla notifiche non lette
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', data.id)
          .eq('read', false);
        setHasUnreadNotifs((count || 0) > 0);
      }
    })();
  }, []);

  // Realtime Setup: si attiva solo dopo aver ottenuto currentUserId
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('public:all_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadDbPosts();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'likes' }, () => {
        loadDbPosts();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'likes' }, () => {
        loadDbPosts();
      })
      // Aggiorna il conteggio commenti in tempo reale senza ricaricare tutto il feed
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        const pid = (payload.new as any).post_id;
        setDbPosts(prev => prev.map(p =>
          p.id === pid ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        loadStories();
      })
      // Badge notifiche in tempo reale
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${currentUserId}`,
      }, () => {
        setHasUnreadNotifs(true);
      })
      .subscribe((status, err) => {
        if (err) console.warn('[Realtime] errore subscription:', err);
      });

    // Polling fallback ogni 60s per le storie
    const storiesPoller = setInterval(() => { loadStories(); }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(storiesPoller);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadDbPosts = useCallback(async () => {
    // 1. Carica i post e sondaggi (query semplice, nessun join)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !posts || posts.length === 0) return;

    const postIds = posts.map((p: any) => p.id);
    const userIds = [...new Set(posts.map((p: any) => p.user_id).filter(Boolean))];

    // 2. Carica utenti, tags, likes, commenti in parallelo
    const [
      { data: usersData },
      { data: tagsData },
      { data: likesData },
      { data: commentsData },
      authResult,
    ] = await Promise.all([
      supabase.from('users').select('id, username, name, avatar_url, discipline, role').in('id', userIds),
      supabase.from('post_tags').select('post_id, tag').in('post_id', postIds),
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id').in('post_id', postIds),
      supabase.auth.getUser(),
    ]);

    // Ottieni id db dell'utente loggato
    let dbUserId: string | null = null;
    if (authResult.data.user) {
      const { data: u } = await supabase
        .from('users').select('id').eq('auth_id', authResult.data.user.id).single();
      dbUserId = u?.id ?? null;
    }

    // Mappa rapida per accesso O(1)
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });

    const tagsByPost: Record<string, string[]> = {};
    (tagsData || []).forEach((t: any) => {
      if (!tagsByPost[t.post_id]) tagsByPost[t.post_id] = [];
      tagsByPost[t.post_id].push(t.tag);
    });

    const likesByPost: Record<string, string[]> = {};
    (likesData || []).forEach((l: any) => {
      if (!likesByPost[l.post_id]) likesByPost[l.post_id] = [];
      likesByPost[l.post_id].push(l.user_id);
    });

    const commentsByPost: Record<string, number> = {};
    (commentsData || []).forEach((c: any) => {
      commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1;
    });

    const FALLBACK_AVATAR = null;

    setDbPosts(posts.map((p: any) => {
      const u = userMap[p.user_id] || {};
      // Supporto sia array image_urls (nuovo) che singola image_url (legacy)
      const imageUrls: string[] = Array.isArray(p.image_urls) && p.image_urls.length > 0
        ? p.image_urls
        : p.image_url ? [p.image_url] : [];
      return {
        type: p.type || 'post',
        id: p.id,
        userId: p.user_id,
        pollQuestion: p.poll_question,
        pollOptions: p.poll_options,
        author: {
          name:       u.name       || 'Utente',
          username:   u.username   || 'utente',
          avatarUrl:  u.avatar_url || FALLBACK_AVATAR,
          discipline: u.discipline || '',
          role:       u.role       || null,
        },
        imageUrls,
        aspectRatio:   p.aspect_ratio || 1,
        likesCount:    (likesByPost[p.id] || []).length,
        commentsCount: commentsByPost[p.id] || 0,
        isLiked:       dbUserId ? (likesByPost[p.id] || []).includes(dbUserId) : false,
        currentUserId: dbUserId,
        caption:       p.caption   || '',
        timeAgo:       formatTimeAgo(p.created_at),
        tags:          tagsByPost[p.id] || [],
        groupName:     p.group_name || undefined,
      };
    }));
  }, []);

  const loadStories = useCallback(async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data || data.length === 0) return;

    const userIds = [...new Set(data.map((s: any) => s.user_id).filter(Boolean))];
    const { data: usersData } = await supabase
      .from('users').select('id, username, name, avatar_url').in('id', userIds);

    const FALLBACK = null;
    const userMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { userMap[u.id] = u; });

    // Raggruppa le storie per utente (ordine: più recente per utente)
    const groupMap: Record<string, UserStoryGroup> = {};
    data.forEach((s: any) => {
      if (!s.user_id) return;
      if (!groupMap[s.user_id]) {
        const u = userMap[s.user_id] || {};
        groupMap[s.user_id] = {
          userId:   s.user_id,
          username: u.username  || 'utente',
          name:     u.name      || 'Utente',
          avatarUrl: u.avatar_url || FALLBACK,
          stories:  [],
        };
      }
      groupMap[s.user_id].stories.push({
        id:       s.id,
        imageUrl: s.image_url,
        timeAgo:  formatTimeAgo(s.created_at),
      });
    });

    setStories(Object.values(groupMap));
  }, []);

  useEffect(() => { loadDbPosts(); loadStories(); }, [loadDbPosts, loadStories]);

  const handleTabPress = (tab: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (tab === 'create') {
      setCreateMenuVisible(true);
      return;
    }
    setActiveTab(tab);
  };

  const renderHeader = () => (
    <View>
      {/* ── SEGUITI ── */}
      <View style={storyStyles.sectionBlock}>
        <Text style={storyStyles.sectionLabel}>Seguiti</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={storyStyles.storiesRow}
        >
          {/* Crea storia: avatarUrl=null finché non caricato → StoryRing mostra placeholder locale */}
          <StoryRing
            id="create"
            username="La tua storia"
            avatarUrl={currentUserAvatar}
            isCustom={true}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCreateStoryVisible(true); }}
          />
          {stories.map((group, idx) => (
            <StoryRing
              key={group.userId}
              id={group.userId}
              username={group.username}
              avatarUrl={group.avatarUrl}
              hasUnwatched={true}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveStoryIndex(idx);
                setStoryVisible(true);
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER con 4 icone ── */}
      <View style={styles.header}>
        {/* Sinistra: chat + search */}
        <View style={styles.headerSide}>
          <Pressable style={styles.iconButton} onPress={() => setChatVisible(true)}>
            <Ionicons name="chatbubble-outline" size={24} color="#111111" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setSearchVisible(true)}>
            <Ionicons name="search-outline" size={24} color="#111111" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={[styles.logoText, { color: ORANGE }]}>JES</Text>
        </Pressable>

        {/* Destra: groups + notifiche */}
        <View style={styles.headerSide}>
          <Pressable style={styles.iconButton} onPress={() => setGroupsVisible(true)}>
            <Ionicons name="people-outline" size={24} color="#111111" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => { setNotifVisible(true); setHasUnreadNotifs(false); }}>
            <Ionicons name="notifications-outline" size={24} color="#111111" />
            {hasUnreadNotifs && <View style={styles.notificationBadge} />}
          </Pressable>
        </View>
      </View>

      {/* ── FEED ── */}
      <FlatList
        ref={flatListRef}
        data={feedData}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          if (item.type === 'poll') {
            return (
              <FeedPoll
                postId={item.id}
                question={item.pollQuestion}
                initialOptions={item.pollOptions || []}
                initialTotalVotes={item.pollOptions?.reduce((acc: number, o: any) => acc + (o.votes || 0), 0) || 0}
                currentUserId={currentUserId ?? undefined}
                postUserId={item.userId}
                isAdmin={isAdmin}
                onDelete={() => setDbPosts(prev => prev.filter((p: any) => p.id !== item.id))}
              />
            );
          }
          if (item.type === 'adv') {
            return (
              <Pressable
                style={styles.advCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(item.url);
                }}
              >
                <View style={styles.advSponBadge}>
                  <Ionicons name="megaphone-outline" size={11} color="#888" style={{ marginRight: 4 }} />
                  <Text style={styles.advSponText}>SPONSORIZZATO</Text>
                </View>
                <Image source={item.imageSource} style={styles.advImage} resizeMode="contain" />
                <View style={styles.advFooter}>
                  <View style={styles.advLinkBtn}>
                    <Text style={styles.advLinkText}>Visita il link</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                </View>
              </Pressable>
            );
          }
          return (
            <PostCard
              {...(item as any)}
              currentUserAvatar={currentUserAvatar}
              isFollowingAuthor={followingIds.has(item.userId)}
              onFollowAuthor={(userId: string) => {
                setFollowingIds(prev => new Set([...prev, userId]));
              }}
              onImagePress={(url: string) => {
                setViewerUrl(url);
                setViewerVisible(true);
              }}
              onCommentPress={() => {
                setCommentsPostId(item.id);
                setCommentsAuthorId(item.userId || null);
                setCommentsVisible(true);
              }}
              onUserPress={(userId: string) => {
                setProfileTargetUserId(userId);
                setProfileVisible(true);
              }}
              isAdmin={isAdmin}
              onDelete={() => setDbPosts(prev => prev.filter(p => p.id !== item.id))}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 8 }}
      />

      {/* ── FRECCIA SCROLL-TO-TOP ── */}
      {showScrollTop && (
        <Animated.View style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              Animated.timing(scrollTopOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                setShowScrollTop(false);
              });
            }}
            style={styles.scrollTopInner}
          >
            <Ionicons name="chevron-up" size={20} color="#555" />
          </Pressable>
        </Animated.View>
      )}

      {/* ── NAV BOTTOM ── */}
      <View style={[styles.bottomFooter, { paddingBottom: insets.bottom, height: 56 + insets.bottom }]}>
        <Pressable style={styles.footerTab} onPress={() => handleTabPress('home')}>
          <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={26} color={activeTab === 'home' ? ORANGE : '#AAAAAA'} />
        </Pressable>
        <Pressable style={styles.footerTab} onPress={() => handleTabPress('create')}>
          <View style={styles.createCircle}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
        </Pressable>
        <Pressable style={styles.footerTab} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setProfileTargetUserId(undefined);
          setProfileVisible(true);
        }}>
          <Ionicons name={profileVisible ? 'person' : 'person-outline'} size={26} color={profileVisible ? ORANGE : '#AAAAAA'} />
        </Pressable>
      </View>

      {/* ── TUTTI I MODAL ── */}

      <StoryViewer
        groups={stories}
        initialGroupIndex={activeStoryIndex}
        visible={storyVisible}
        onClose={() => setStoryVisible(false)}
        currentUserId={currentUserId}
        onUserPress={(userId) => {
          setStoryVisible(false);
          setProfileTargetUserId(userId);
          setProfileVisible(true);
        }}
      />

      <ImageViewerModal
        imageUrl={viewerUrl}
        visible={viewerVisible}
        onClose={() => { setViewerVisible(false); setViewerUrl(null); }}
      />

      <CommentsModal
        visible={commentsVisible}
        onClose={() => { setCommentsVisible(false); setCommentsPostId(null); setCommentsAuthorId(null); }}
        postId={commentsPostId}
        postAuthorId={commentsAuthorId}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onUserPress={(userId) => { setProfileTargetUserId(userId); setProfileVisible(true); }}
        onGroupPress={(groupId) => { setGroupsInitialId(groupId); setGroupsVisible(true); }}
        onPostPress={(postId, imageUrl) => { setViewerUrl(imageUrl); setViewerVisible(true); }}
      />
      <GroupsModal
        visible={groupsVisible}
        onClose={() => { setGroupsVisible(false); setGroupsInitialId(undefined); }}
        onPostPublished={(post: any) => setGroupPosts(prev => [post, ...prev])}
        initialGroupId={groupsInitialId}
      />
      <ChatModal
        visible={chatVisible}
        onClose={() => { setChatVisible(false); setChatOpenWith(null); }}
        openWithUserId={chatOpenWith?.userId}
        openWithName={chatOpenWith?.name}
        openWithAvatar={chatOpenWith?.avatar}
      />
      <NotificationsModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <ProfileModal
        visible={profileVisible}
        onClose={() => { setProfileVisible(false); setProfileTargetUserId(undefined); }}
        targetUserId={profileTargetUserId}
        onMessagePress={(userId, name, avatar) => {
          setChatOpenWith({ userId, name, avatar });
          setProfileVisible(false);
          setTimeout(() => setChatVisible(true), 350);
        }}
        onRequestViewUser={(userId) => {
          setProfileTargetUserId(userId);
        }}
        onPostAsJes={(jesUserId, type) => {
          if (type === 'post') setJesPostAuthorId(jesUserId);
          else setJesStoryAuthorId(jesUserId);
          setProfileVisible(false);
          setTimeout(() => {
            if (type === 'post') setCreatePostVisible(true);
            else setCreateStoryVisible(true);
          }, 700);
        }}
      />

      <CreateMenuModal
        visible={createMenuVisible}
        onClose={() => setCreateMenuVisible(false)}
        onPost={() => setCreatePostVisible(true)}
        onStory={() => setCreateStoryVisible(true)}
        onPoll={() => setCreatePollVisible(true)}
      />
      <CreatePostModal
        visible={createPostVisible}
        onClose={() => { setCreatePostVisible(false); setJesPostAuthorId(undefined); }}
        onPublished={loadDbPosts}
        authorUserId={jesPostAuthorId}
      />
      <CreateStoryModal
        visible={createStoryVisible}
        onClose={() => { setCreateStoryVisible(false); setJesStoryAuthorId(undefined); }}
        onPublished={loadStories}
        authorUserId={jesStoryAuthorId}
      />
      <CreatePollModal visible={createPollVisible} onClose={() => setCreatePollVisible(false)} />
    </View>
  );
}

const storyStyles = StyleSheet.create({
  sectionBlock:     { borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 4 },
  sectionBlockSugg: { backgroundColor: '#FAFAFA' },
  sectionLabel:     { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#AAAAAA', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  storiesRow:       { paddingHorizontal: 16, paddingVertical: 6, gap: 0 },
});

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#FFFFFF' },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  headerSide:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoText:          { fontFamily: 'Poppins_800ExtraBold', fontSize: 30, color: ORANGE, letterSpacing: -1 },
  iconButton:        { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notificationBadge: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' },
  bottomFooter:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEEEEE', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 8 },
  footerTab:         { flex: 1, alignItems: 'center', justifyContent: 'center', height: 48 },
  createCircle:      { width: 46, height: 46, borderRadius: 999, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center' },

  /* Scroll-to-top */
  scrollTopBtn:   { position: 'absolute', bottom: 76, alignSelf: 'center', zIndex: 20, left: 0, right: 0, alignItems: 'center' },
  scrollTopInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },

  /* ADV */
  advCard:     { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, backgroundColor: '#FFFFFF', overflow: 'hidden', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  advSponBadge:{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', margin: 8, backgroundColor: '#F5F5F5', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  advSponText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#888888', letterSpacing: 0.8 },
  advImage:    { width: '100%', height: 340 },
  advFooter:   { paddingHorizontal: 16, paddingVertical: 12 },
  advLinkBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 12 },
  advLinkText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#FFFFFF' },
});
