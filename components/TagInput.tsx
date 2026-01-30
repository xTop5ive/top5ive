'use client';
import { useState, useRef, KeyboardEvent } from 'react';

type Props = { name?: string; max?: number };

export default function TagInput({ name = 'tags', max = 8 }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(raw: string) {
    const t = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 &-]/gi, '')
      .slice(0, 24);
    if (!t) return;
    setTags((prev) => {
      const next = Array.from(new Set([...prev, t]));
      return next.slice(0, max);
    });
    if (inputRef.current) inputRef.current.value = '';
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' ) {
      e.preventDefault();
      add((e.target as HTMLInputElement).value);
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '' && tags.length) {
      // quick delete last tag
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div className="border border-white/15 rounded p-2">
      {/* Hidden field that the API reads */}
      <input type="hidden" name={name} value={tags.join(',')} />
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 px-2 py-1 rounded bg-white/10 text-sm"
          >
            {t}
            <button
              type="button"
              aria-label={`remove ${t}`}
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              className="opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? 'add another…' : 'type a tag, press Enter'}
          className="bg-transparent outline-none flex-1 min-w-[10ch] text-sm"
        />
      </div>
    </div>
  );
}