'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreatePollModal({ visible, onClose }: Props) {
  const { t } = useLang();
  
  const DURATIONS = [
    { id: '1d', label: t('day_1') },
    { id: '3d', label: t('days_3') },
    { id: '7d', label: t('days_7') },
  ] as const;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState<'1d' | '3d' | '7d'>('1d');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setQuestion(''); setOptions(['', '']); setDuration('1d'); setError(''); };
  const close = () => { reset(); onClose(); };

  const updateOption = (i: number, val: string) =>
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  const addOption = () => { if (options.length < 5) setOptions(p => [...p, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(p => p.filter((_, idx) => idx !== i)); };

  const filledOptions = options.filter(o => o.trim().length > 0);
  const canPublish = question.trim().length > 0 && filledOptions.length >= 2;

  const publish = async () => {
    if (!canPublish || publishing) { setError(t('poll_fill_error')); return; }
    setPublishing(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t('not_logged'));
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) throw new Error(t('profile_not_found'));

      const pollOptions = filledOptions.map((opt, idx) => ({ id: String.fromCharCode(65 + idx), label: opt, votes: 0 }));
      const durationDays: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };
      const expires = new Date();
      expires.setDate(expires.getDate() + (durationDays[duration] ?? 1));

      const { error: err } = await supabase.from('posts').insert({
        user_id: dbUser.id, type: 'poll',
        poll_question: question.trim(), poll_options: pollOptions,
        aspect_ratio: 1, privacy: 'all',
      });
      if (err) throw new Error(err.message);
      close();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-sheet poll-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <button className="modal-close" onClick={close}>
            <svg width="18" height="18" fill="none" stroke="#111" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <span className="modal-title">{t('new_poll')}</span>
          <button
            className={`poll-publish-btn${canPublish ? '' : ' off'}`}
            onClick={publish}
            disabled={publishing}
          >
            {publishing ? '...' : t('publish')}
          </button>
        </div>

        {error && <p className="poll-error">{error}</p>}

        {/* Domanda */}
        <div className="poll-section">
          <label className="poll-section-title">{t('question_label')} <span className="poll-req">*</span></label>
          <textarea
            className="poll-question-input"
            placeholder={t('write_something')}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={200}
            rows={3}
            autoFocus
          />
          <span className="poll-char-count">{question.length}/200</span>
        </div>

        {/* Risposte */}
        <div className="poll-section">
          <label className="poll-section-title">
            {t('answers_label')} <span className="poll-req">*</span>
            <span className="poll-section-note"> {t('answers_note')}</span>
          </label>
          {options.map((opt, i) => (
            <div key={i} className="poll-opt-row">
              <div className="poll-opt-bullet">
                <span>{String.fromCharCode(65 + i)}</span>
              </div>
              <input
                className="poll-opt-input"
                placeholder={`${t('answers_label')} ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                maxLength={80}
              />
              {i >= 2 && (
                <button className="poll-opt-remove" onClick={() => removeOption(i)}>
                  <svg width="20" height="20" fill="#DDD" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                </button>
              )}
            </div>
          ))}
          {options.length < 5 && (
            <button className="poll-add-btn" onClick={addOption}>
              <svg width="20" height="20" fill="none" stroke="var(--orange)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              {t('add_answer')}
            </button>
          )}
        </div>

        {/* Durata */}
        <div className="poll-section">
          <label className="poll-section-title">{t('duration_label')}</label>
          <div className="poll-duration-row">
            {DURATIONS.map(d => (
              <button
                key={d.id}
                className={`poll-duration-chip${duration === d.id ? ' active' : ''}`}
                onClick={() => setDuration(d.id)}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
