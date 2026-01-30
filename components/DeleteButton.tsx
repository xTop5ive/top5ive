'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onDelete() {
    if (!confirm('Delete this playlist? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) {
      router.replace('/dashboard');
      router.refresh();
    } else {
      const msg = await res.text().catch(() => '');
      alert(msg || 'Delete failed');
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="text-sm px-3 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
