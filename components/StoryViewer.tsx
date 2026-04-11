'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserStoryGroup {
  userId: string; username: string; name: string; avatarUrl: string | null;
  stories: { id: string; imageUrl: string; timeAgo: string }[];
}

interface Props {
  groups: UserStoryGroup[]; initialGroupIndex: number;
  visible: boolean; onClose: () => void;
}

export default function StoryViewer({ groups, initialGroupIndex, visible, onClose }: Props) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);

  useEffect(() => { setGroupIdx(initialGroupIndex); setStoryIdx(0); }, [initialGroupIndex, visible]);

  if (!visible || groups.length === 0) return null;

  const group = groups[groupIdx];
  if (!group) return null;
  const story = group.stories[storyIdx];

  const next = () => {
    if (storyIdx < group.stories.length - 1) { setStoryIdx(s => s + 1); return; }
    if (groupIdx < groups.length - 1) { setGroupIdx(g => g + 1); setStoryIdx(0); }
    else { onClose(); }
  };
  const prev = () => {
    if (storyIdx > 0) { setStoryIdx(s => s - 1); return; }
    if (groupIdx > 0) { setGroupIdx(g => g - 1); setStoryIdx(0); }
  };

  return (
    <div className="story-viewer" onClick={next}>
      {/* Progress bars */}
      <div className="story-bars">
        {group.stories.map((_, i) => (
          <div key={i} className={`story-bar${i <= storyIdx ? ' done' : ''}`} style={{ opacity: i < storyIdx ? 1 : i === storyIdx ? 0.9 : 0.4 }} />
        ))}
      </div>

      {/* Header */}
      <div className="story-viewer-header">
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#444', flexShrink: 0 }}>
          {group.avatarUrl && <img src={group.avatarUrl} alt={group.name} width={36} height={36} style={{ objectFit: 'cover', borderRadius: '50%' }} />}
        </div>
        <div>
          <div className="story-viewer-name">{group.name}</div>
          <div className="story-viewer-time">{story?.timeAgo}</div>
        </div>
        <button className="story-close" onClick={e => { e.stopPropagation(); onClose(); }}>
          <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Image */}
      {story?.imageUrl && (
        <img className="story-viewer-img" src={story.imageUrl} alt="" style={{ flex: 1, objectFit: 'contain' }} />
      )}

      {/* Left/Right tap zones */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%' }}
        onClick={e => { e.stopPropagation(); prev(); }} />
      <div style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%' }}
        onClick={e => { e.stopPropagation(); next(); }} />
    </div>
  );
}
