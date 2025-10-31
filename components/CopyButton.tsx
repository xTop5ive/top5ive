'use client';

import { useState } from 'react';

export default function CopyButton({
  text,
  children,
  className = ''
}: { text?: string; children?: React.ReactNode; className?: string }) {
  const [ok, setOk] = useState(false);

  async function copy() {
    try {
      const value = text ?? window.location.href;
      await navigator.clipboard.writeText(value);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch {
      alert('Could not copy');
    }
  }

  return (
    <button
      onClick={copy}
      className={className || 'px-3 py-1 rounded border'}
      aria-live="polite"
    >
      {ok ? 'Copied!' : children ?? 'Copy link'}
    </button>
  );
}
