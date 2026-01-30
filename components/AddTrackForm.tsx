'use client';

import { useState } from 'react';

export default function AddTrackForm({ playlistId }: { playlistId: string }) {
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch(`/api/playlists/${playlistId}/tracks`, { method: 'POST', body: fd });
    setBusy(false);
    if (res.ok) {
      (e.currentTarget as HTMLFormElement).reset();
      location.reload();
    } else {
      const msg = await res.text().catch(() => '');
      alert(msg || 'Failed to add track');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 rounded border border-white/10 p-3">
      <div className="text-sm font-medium">Add a track (YouTube or Spotify link)</div>
      <input
        name="url"
        placeholder="https://youtu.be/... or https://open.spotify.com/track/..."
        className="rounded border border-white/10 bg-transparent px-3 py-2"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <input name="title" placeholder="Title" className="rounded border border-white/10 bg-transparent px-3 py-2" required />
        <input name="artist" placeholder="Artist (optional)" className="rounded border border-white/10 bg-transparent px-3 py-2" />
      </div>
      <button disabled={busy} className="self-start rounded bg-white/10 px-4 py-2 disabled:opacity-50">
        {busy ? 'Adding…' : 'Add track'}
      </button>
    </form>
  );
}
