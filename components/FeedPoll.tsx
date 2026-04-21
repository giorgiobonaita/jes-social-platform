'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang, T } from '@/lib/i18n';

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

export default function FeedPoll({
  postId, question, initialOptions, initialTotalVotes,
  currentUserId, postUserId, isAdmin, onDelete,
}: FeedPollProps) {
  const { lang } = useLang();
  const t = (k: string) => T[lang][k] ?? T['en'][k] ?? k;

  const [hasVoted, setHasVoted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [options, setOptions] = useState(initialOptions);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);
  const [loadingVote, setLoadingVote] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (!dbUser || cancelled) return;
        const { data: existingVote } = await supabase
          .from('poll_votes').select('option_id').eq('post_id', postId).eq('user_id', dbUser.id).maybeSingle();
        if (!cancelled && existingVote) {
          setHasVoted(true);
          setSelectedId(existingVote.option_id);
        }
      } finally {
        if (!cancelled) setLoadingVote(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    setOptions(initialOptions);
    setTotalVotes(initialTotalVotes);
  }, [initialOptions, initialTotalVotes]);

  const handleVote = async (id: string) => {
    if (hasVoted || loadingVote) return;
    setSelectedId(id);
    setHasVoted(true);
    const newOptions = options.map(opt => opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt);
    setOptions(newOptions);
    setTotalVotes(p => p + 1);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('not_logged'));
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) throw new Error(t('profile_not_found'));
      const { error } = await supabase.from('poll_votes').insert({ post_id: postId, user_id: dbUser.id, option_id: id });
      if (error) throw error;
      await supabase.from('posts').update({ poll_options: newOptions }).eq('id', postId);
    } catch {
      setHasVoted(false);
      setSelectedId(null);
      setOptions(initialOptions);
      setTotalVotes(initialTotalVotes);
    }
  };

  const handleDelete = async () => {
    await supabase.from('posts').delete().eq('id', postId);
    onDelete?.();
  };

  const canDelete = currentUserId && (currentUserId === postUserId || isAdmin);

  return (
    <div className="feed-poll">
      <div className="poll-header-row">
        <span className="poll-label">{t('sondaggio')}</span>
        {canDelete && (
          <button className="poll-delete-btn" onClick={() => setConfirmDelete(true)}>
            <svg width="18" height="18" fill="none" stroke="#AAAAAA" strokeWidth="1.8" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        )}
      </div>

      <p className="poll-question">{question}</p>

      <div className="poll-options">
        {options.map(opt => {
          const pct = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
          const isSel = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              className={`poll-option${isSel ? ' selected' : ''}`}
              onClick={() => handleVote(opt.id)}
              disabled={hasVoted || loadingVote}
            >
              {hasVoted && (
                <div className={`poll-progress${isSel ? ' selected' : ''}`} style={{ width: `${pct}%` }} />
              )}
              <div className="poll-option-content">
                <span className={`poll-option-label${isSel ? ' selected' : ''}`}>{opt.label}</span>
                {hasVoted && <span className={`poll-pct${isSel ? ' selected' : ''}`}>{pct}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      <p className="poll-footer">{totalVotes.toLocaleString()} {t('votes_anonymous')}</p>

      {confirmDelete && (
        <div className="modal-overlay center" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">{t('delete_poll')}</p>
            <p className="confirm-msg">{t('delete_poll_confirm')}</p>
            <button className="confirm-btn-danger" onClick={handleDelete}>{t('delete')}</button>
            <button className="confirm-btn-cancel" onClick={() => setConfirmDelete(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
