'use client';
import { useState } from 'react';

export default function ShareButton({ href }: { href: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          await navigator.clipboard.writeText(origin + href);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className="text-xs underline"
      aria-label="Copy share link"
    >
      {ok ? 'Copied!' : 'Share'}
    </button>
  );
}
