import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import PostCard from './PostCard';
import FeedPoll from './FeedPoll';

interface Props {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
  onImagePress: (url: string) => void;
  onCommentPress: (id: string) => void;
  currentUserId: string | null;
  isAdmin: boolean;
}

export default function SinglePostModal({ visible, onClose, postId, onImagePress, onCommentPress, currentUserId, isAdmin }: Props) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadPost();
    }
  }, [visible, postId]);

  const loadPost = async () => {
    setLoading(true);
    const { data: p } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (!p) { setLoading(false); return; }

    const { data: u } = await supabase.from('users').select('name, username, avatar_url, discipline').eq('id', p.user_id).single();
    const { data: likes } = await supabase.from('likes').select('user_id').eq('post_id', p.id);
    const { count } = await supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id);

    const imageUrls: string[] = Array.isArray(p.image_urls) && p.image_urls.length > 0
        ? p.image_urls
        : p.image_url ? [p.image_url] : [];
        
    setPost({
      type: p.type || 'post',
      id: p.id,
      userId: p.user_id,
      pollQuestion: p.poll_question,
      pollOptions: p.poll_options,
      author: {
        name:       u?.name       || 'Utente',
        username:   u?.username   || 'utente',
        avatarUrl:  u?.avatar_url || null,
        discipline: u?.discipline || '',
      },
      imageUrls,
      aspectRatio:   p.aspect_ratio || 1,
      likesCount:    likes ? likes.length : 0,
      commentsCount: count || 0,
      isLiked:       currentUserId ? (likes || []).some(l => l.user_id === currentUserId) : false,
      currentUserId: currentUserId,
      caption:       p.caption   || '',
      timeAgo:       'Di recente',
      tags:          [],
      groupName:     p.group_name || undefined,
    });
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={26} color="#111" />
          </TouchableOpacity>
        </View>
        
        {loading || !post ? (
          <ActivityIndicator color="#F07B1D" style={{ marginTop: 60 }} />
        ) : (
          post.type === 'poll' ? (
             <FeedPoll
                postId={post.id}
                question={post.pollQuestion}
                initialOptions={post.pollOptions || []}
                initialTotalVotes={post.pollOptions?.reduce((acc: number, o: any) => acc + (o.votes || 0), 0) || 0}
              />
          ) : (
          <PostCard
            {...post}
            onImagePress={onImagePress}
            onCommentPress={() => onCommentPress(post.id)}
            isAdmin={isAdmin}
            onDelete={onClose}
          />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerBtn: { width: 44, alignItems: 'flex-start' },
});
