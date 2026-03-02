"use client";

import { useState } from "react";

export default function AddTrackForm({ playlistId }: { playlistId: string }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, url, bpm, key }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data.error || "Failed to add track");
      return;
    }

    // clear form
    setTitle("");
    setArtist("");
    setUrl("");
    setBpm("");
    setKey("");
    setMsg("Added!");
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-white/10 rounded p-4 bg-white/5">
      <div className="font-semibold">Add a track</div>

      <input
        className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
        placeholder="Song title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
        placeholder="Artist (optional)"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
      />

      <input
        className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
        placeholder="YouTube or Spotify link"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="flex gap-2">
        <input
          className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
          placeholder="BPM (optional)"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
        />
        <input
          className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
          placeholder="Key (optional)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>

      <button
        disabled={loading}
        className="rounded bg-white text-black px-4 py-2 hover:bg-gray-200 disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add Track"}
      </button>

      {msg && <div className="text-sm text-white/70">{msg}</div>}
    </form>
  );
}