'use client';

import { useState } from 'react';

export default function LikeButton({
  playlistId,
  initialCount,
  initiallyLiked,
}: {
  playlistId: string;
  initialCount: number;
  initiallyLiked: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/like`, { method: 'POST' });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(Boolean(data.liked));
      setCount(Number(data.count));
    } catch (e) {
      console.error('Toggle like failed:', e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded border border-white/15 hover:bg-white/10 disabled:opacity-50"
      aria-pressed={liked}
      aria-label={liked ? 'Unlike playlist' : 'Like playlist'}
    >
      <span aria-hidden>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}
