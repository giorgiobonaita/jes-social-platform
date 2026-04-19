import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface FeedPollProps {
  postId: string;
  question: string;
  initialOptions: PollOption[];
  initialTotalVotes: number;
  currentUserId?: string | null;
  postUserId?: string | null;
  isAdmin?: boolean;
  onDelete?: () => void;
}

export default function FeedPoll({ postId, question, initialOptions, initialTotalVotes, currentUserId, postUserId, isAdmin, onDelete }: FeedPollProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);
  const [loadingVote, setLoadingVote] = useState(true);

  // Al mount: controlla se l'utente ha già votato
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: dbUser } = await supabase
          .from('users').select('id').eq('auth_id', user.id).single();
        if (!dbUser || cancelled) return;

        const { data: existingVote } = await supabase
          .from('poll_votes')
          .select('option_id')
          .eq('post_id', postId)
          .eq('user_id', dbUser.id)
          .maybeSingle();

        if (!cancelled && existingVote) {
          setHasVoted(true);
          setSelectedId(existingVote.option_id);
        }
      } catch {
        // Ignora errori di rete al mount
      } finally {
        if (!cancelled) setLoadingVote(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  // Aggiorna le opzioni se cambiano dall'esterno (feed refresh)
  useEffect(() => {
    setOptions(initialOptions);
    setTotalVotes(initialTotalVotes);
  }, [initialOptions, initialTotalVotes]);

  const handleVote = async (id: string) => {
    if (hasVoted || loadingVote) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Aggiorna ottimisticamente UI
    setSelectedId(id);
    setHasVoted(true);
    const newOptions = options.map(opt =>
      opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt
    );
    setOptions(newOptions);
    setTotalVotes(prev => prev + 1);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non loggato');
      const { data: dbUser } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) throw new Error('Profilo non trovato');

      // Inserisci voto (la tabella poll_votes deve avere unique su post_id+user_id)
      const { error: voteErr } = await supabase
        .from('poll_votes')
        .insert({ post_id: postId, user_id: dbUser.id, option_id: id });

      if (voteErr) throw voteErr;

      // Aggiorna i contatori nel post
      await supabase
        .from('posts')
        .update({ poll_options: newOptions })
        .eq('id', postId);

    } catch (e: any) {
      // Rollback UI in caso di errore
      setHasVoted(false);
      setSelectedId(null);
      setOptions(initialOptions);
      setTotalVotes(initialTotalVotes);
      Alert.alert('Errore', e.message || 'Impossibile registrare il voto.');
    }
  };

  const canDelete = currentUserId && (currentUserId === postUserId || isAdmin);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Elimina sondaggio', 'Sei sicuro di voler eliminare questo sondaggio?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('posts').delete().eq('id', postId);
          onDelete?.();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pollHeader}>
        <Text style={styles.headerText}>SONDAGGIO</Text>
        {canDelete && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={18} color="#AAAAAA" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.question}>{question}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
          const isSelected = selectedId === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.9}
              onPress={() => handleVote(option.id)}
              disabled={hasVoted || loadingVote}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            >
              {hasVoted && (
                <View style={[
                  styles.progressBar,
                  { width: `${percentage}%` },
                  isSelected && styles.progressBarSelected,
                ]} />
              )}

              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {hasVoted && (
                  <Text style={[styles.percentageText, isSelected && styles.percentageSelected]}>
                    {percentage}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.footerText}>{totalVotes.toLocaleString()} VOTI • ANONIMO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    marginVertical: 16,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: '#A0A0A0',
    letterSpacing: 2,
  },
  question: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 24,
    color: '#000000',
    lineHeight: 32,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  optionsContainer: {
    gap: 8,
  },
  optionRow: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionRowSelected: {
    borderColor: '#F07B1D',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  progressBarSelected: {
    backgroundColor: '#FEF0E9',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  optionLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#000000',
  },
  optionLabelSelected: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#F07B1D',
  },
  percentageText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#888888',
  },
  percentageSelected: {
    color: '#F07B1D',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  footerText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 20,
    letterSpacing: 1,
  },
});
