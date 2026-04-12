'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export interface UserStoryGroup {
  userId: string; username: string; name: string; avatarUrl: string | null;
  stories: { id: string; imageUrl: string; timeAgo: string }[];
}

interface Props {
  groups: UserStoryGroup[]; initialGroupIndex: number;
  visible: boolean; onClose: () => void;
}

const STORY_DURATION = 5000;

export default function StoryViewer({ groups, initialGroupIndex, visible, onClose }: Props) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const pausedRef = useRef(false);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRef.current) clearTimeout(autoRef.current);
  }, []);

  const goNext = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    setIsLiked(false);
    setGroupIdx(g => {
      const grp = groups[g];
      if (!grp) return g;
      setStoryIdx(s => {
        if (s < grp.stories.length - 1) return s + 1;
        // next group
        if (g < groups.length - 1) {
          setGroupIdx(g + 1);
          return 0;
        }
        onClose();
        return s;
      });
      return g;
    });
  }, [groups, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    setIsLiked(false);
    if (storyIdx > 0) { setStoryIdx(s => s - 1); return; }
    if (groupIdx > 0) { setGroupIdx(g => g - 1); setStoryIdx(0); }
  }, [storyIdx, groupIdx]);

  const startTimer = useCallback(() => {
    clearTimers();
    progressRef.current = 0;
    setProgress(0);
    const tick = 50; // ms
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      progressRef.current += (tick / STORY_DURATION) * 100;
      setProgress(Math.min(progressRef.current, 100));
      if (progressRef.current >= 100) {
        clearTimers();
        // go next
        setStoryIdx(s => {
          const grp = groups[groupIdx];
          if (!grp) return s;
          if (s < grp.stories.length - 1) { setIsLiked(false); return s + 1; }
          if (groupIdx < groups.length - 1) {
            setGroupIdx(g => g + 1);
            setIsLiked(false);
            return 0;
          }
          onClose();
          return s;
        });
      }
    }, tick);
  }, [clearTimers, groups, groupIdx, onClose]);

  // Reset on story/group change or visibility
  useEffect(() => {
    if (!visible) { clearTimers(); return; }
    setIsLiked(false);
    progressRef.current = 0;
    setProgress(0);
    pausedRef.current = false;
    setPaused(false);
    startTimer();
    return clearTimers;
  }, [groupIdx, storyIdx, visible]); // eslint-disable-line

  useEffect(() => {
    if (visible) { setGroupIdx(initialGroupIndex); setStoryIdx(0); }
  }, [visible, initialGroupIndex]);

  const handlePause = () => { pausedRef.current = true; setPaused(true); };
  const handleResume = () => { pausedRef.current = false; setPaused(false); };

  if (!visible || !group || !story) return null;

  return (
    <div className="sv-overlay" onContextMenu={e => e.preventDefault()}>
      {/* Background image */}
      <img src={story.imageUrl} alt="" className="sv-img" draggable={false} />

      {/* Top gradient */}
      <div className="sv-grad-top" />
      {/* Bottom gradient */}
      <div className="sv-grad-bottom" />

      {/* Progress bars */}
      <div className="sv-bars">
        {group.stories.map((_, i) => (
          <div key={i} className="sv-bar-track">
            <div
              className="sv-bar-fill"
              style={{
                width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                transition: i === storyIdx ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="sv-header">
        <div className="sv-avatar">
          {group.avatarUrl
            ? <img src={group.avatarUrl} alt={group.name} className="sv-avatar-img" />
            : <svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
          }
        </div>
        <div className="sv-info">
          <div className="sv-name">{group.name}</div>
          <div className="sv-time">{story.timeAgo}</div>
        </div>
        <button className="sv-close" onClick={onClose}>
          <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Tap zones */}
      <div
        className="sv-tap-left"
        onClick={goPrev}
        onMouseDown={handlePause}
        onMouseUp={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
      />
      <div
        className="sv-tap-right"
        onClick={goNext}
        onMouseDown={handlePause}
        onMouseUp={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
      />

      {/* Footer: like button */}
      <div className="sv-footer">
        <button className="sv-like-btn" onClick={() => setIsLiked(p => !p)}>
          {isLiked
            ? <svg width="52" height="52" fill="#FF3B5C" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            : <svg width="52" height="52" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          }
        </button>
      </div>
    </div>
  );
}
