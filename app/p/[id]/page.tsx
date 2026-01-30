// app/p/[id]/page.tsx
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

import DeleteButton from '@/components/DeleteButton';
import AddTrackForm from '@/components/AddTrackForm';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1) Get current user FIRST so we can use userId in the Prisma include
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // 2) Fetch playlist + owner + tags + tracks + like info for this viewer
  const p = await prisma.playlist.findUnique({
    where: { id },
    include: {
      owner: true,
      links: { include: { tag: true } },
      tracks: { orderBy: { position: 'asc' } },
      _count: { select: { likes: true } },
      // TS typing hack so we can conditionally include likes filtered by userId
      likes: (userId ? { where: { userId }, select: { id: true } } : undefined) as any,
    },
  });
  if (!p) return notFound();

  const isOwner = userId === p.ownerId || userId === p.owner?.id;

  // share URL
  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const share = `${proto}://${host}/p/${p.id}`;

  return (
    <main className="p-8 space-y-4 max-w-3xl">
      {/* top nav row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="underline text-sm" href="/dashboard">Back to your dashboard</Link>
          <a href="/explore" className="underline text-sm text-white/70 hover:text-white">← Back to Explore</a>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton href={`/p/${p.id}`} />
          {isOwner && <DeleteButton id={p.id} />}
        </div>
      </div>

      <h1 className="text-3xl font-bold">{p.title}</h1>
      <div className="text-sm text-gray-500">
        by @{p.owner.handle} · {p.isPublic ? 'Public' : 'Private'}
      </div>

      {/* cover */}
      {p.coverUrl ? (
        <img
          src={p.coverUrl}
          alt=""
          className="w-full max-w-md rounded object-cover border border-white/10"
        />
      ) : null}

      {/* description */}
      {p.description ? <p className="text-gray-200">{p.description}</p> : null}

      {/* tags */}
      {p.links.length ? (
        <div className="flex flex-wrap gap-2">
          {p.links.map(l => (
            <span key={l.tagId} className="text-xxs px-2 py-0.5 rounded bg-gray-800 text-gray-200">
              {l.tag.name}
            </span>
          ))}
        </div>
      ) : null}

      {/* like count + button */}
      <div className="mt-2 flex items-center gap-3">
        <LikeButton
          playlistId={p.id}
          initialCount={p._count.likes}
          initiallyLiked={Array.isArray((p as any).likes) && (p as any).likes.length > 0}
        />
        <span className="text-sm text-white/60 break-all">Share: <span className="underline">{share}</span></span>
      </div>

      {/* C) AddTrackForm (owner only) */}
      {isOwner && <AddTrackForm playlistId={p.id} />}

      {/* C) Tracks list with embeds */}
      {p.tracks.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">Tracks</h2>
          <ul className="space-y-3">
            {p.tracks.map((t) => {
              let embed: string | null = null;
              if (t.source === 'youtube' && t.externalId) {
                embed = `https://www.youtube.com/embed/${t.externalId}`;
              } else if (t.source === 'spotify' && t.externalId) {
                embed = `https://open.spotify.com/embed/track/${t.externalId}`;
              }
              return (
                <li key={t.id} className="rounded border border-white/10 p-3">
                  <div className="font-medium truncate">{t.title}</div>
                  {t.artist && <div className="text-sm text-white/60">{t.artist}</div>}
                  <div className="text-xs text-white/50 break-all">{t.url}</div>
                  {embed && (
                    <div className="mt-2">
                      <iframe
                        src={embed}
                        width="100%"
                        height={t.source === 'spotify' ? 152 : 360}
                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                        allowFullScreen
                        className="rounded border border-white/10"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}