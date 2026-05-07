import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { t } from '../lib/i18n';
import AvatarImg from './AvatarImg';

type NotifType = 'like' | 'comment' | 'follow' | 'mention';

interface Notification {
  id: string;
  type: NotifType;
  username: string;
  avatarUrl: string;
  text: string;
  timeAgo: string;
  postThumb?: string;
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t('time_now');
  if (m < 60) return `${m} ${t('time_min_ago')}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${t('time_hour_ago')}`;
  const d = Math.floor(h / 24);
  if (d === 1) return t('time_yesterday');
  return `${d} ${t('time_days_ago')}`;
}

function notifText(type: NotifType): string {
  switch (type) {
    case 'like':    return t('notif_liked');
    case 'comment': return t('notif_commented');
    case 'follow':  return t('notif_followed');
    case 'mention': return t('notif_mentioned');
  }
}

const NOTIF_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  like:    { name: 'heart',       color: '#F07B1D', bg: '#FFF0E6' },
  comment: { name: 'chatbubble',  color: '#2196F3', bg: '#E8F4FD' },
  follow:  { name: 'person-add', color: '#4CAF50', bg: '#E8F5E9' },
  mention: { name: 'at-circle',  color: '#9C27B0', bg: '#F3E5F5' },
};
const NOTIF_ICON_FALLBACK = { name: 'notifications', color: '#888', bg: '#F0F0F0' };

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [myDbId, setMyDbId] = useState<string | null>(null);

  const loadNotifications = useCallback(async (dbUserId: string) => {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('id, type, actor_id, post_id, created_at, read')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !notifs || notifs.length === 0) return;

    const senderIds = [...new Set(notifs.map((n: any) => n.actor_id).filter(Boolean))];
    const { data: senders } = await supabase.from('users').select('id, username, avatar_url').in('id', senderIds);
    const senderMap: Record<string, any> = {};
    (senders || []).forEach((s: any) => { senderMap[s.id] = s; });

    const postIds = [...new Set(notifs.map((n: any) => n.post_id).filter(Boolean))];
    let postMap: Record<string, string> = {};
    if (postIds.length > 0) {
      const { data: posts } = await supabase.from('posts').select('id, image_url, image_urls').in('id', postIds);
      (posts || []).forEach((p: any) => {
        postMap[p.id] = (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || '';
      });
    }

    setNotifications(notifs.map((n: any) => {
      const sender = senderMap[n.actor_id] || {};
      return {
        id:        n.id,
        type:      n.type as NotifType,
        username:  sender.username || t('username_fallback'),
        avatarUrl: sender.avatar_url || null,
        text:      notifText(n.type as NotifType),
        timeAgo:   n.created_at ? formatTimeAgo(n.created_at) : '',
        postThumb: n.post_id ? postMap[n.post_id] : undefined,
      };
    }));

    const unreadIds = notifs.filter((n: any) => !n.read).map((n: any) => n.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (unreadIds.length > 0) {
      supabase.from('notifications').update({ read: true }).in('id', unreadIds).then(() => {});
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        let dbId = myDbId;
        if (!dbId) {
          const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
          if (!dbUser) return;
          dbId = dbUser.id;
          setMyDbId(dbId);
        }
        await loadNotifications(dbId);
      } catch (e) {
        console.warn('[NotificationsModal] errore caricamento:', e);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Realtime: aggiorna quando arriva una nuova notifica mentre il modal è aperto
  useEffect(() => {
    if (!visible || !myDbId) return;
    const ch = supabase.channel(`notifs_modal_${myDbId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${myDbId}`,
      }, () => { loadNotifications(myDbId); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [visible, myDbId, loadNotifications]);

  const renderNotif = ({ item }: { item: Notification }) => {
    const icon = NOTIF_ICONS[item.type] ?? NOTIF_ICON_FALLBACK;
    return (
      <TouchableOpacity style={styles.notifRow} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          <AvatarImg uri={item.avatarUrl} size={48} seed={item.username} style={styles.avatar} />
          <View style={[styles.iconBadge, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name as any} size={11} color={icon.color} />
          </View>
        </View>
        <View style={styles.notifMeta}>
          <Text style={styles.notifText} numberOfLines={3}>
            <Text style={styles.username}>{item.username} </Text>
            {item.text}
          </Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>
        {item.postThumb && (
          <Image source={{ uri: item.postThumb }} style={styles.postThumb} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('notif_title')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#F07B1D" style={{ marginTop: 60 }} />
        ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotif}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t('notif_empty')}</Text>
            </View>
          }
        />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#111',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEE',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notifMeta: {
    flex: 1,
  },
  notifText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#111',
  },
  timeAgo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#AAAAAA',
  },
  postThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#AAAAAA',
  },
});
