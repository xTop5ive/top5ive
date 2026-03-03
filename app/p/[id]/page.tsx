import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import AddTrackForm from "@/components/AddTrackForm";

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const p = await prisma.playlist.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, handle: true } },
      links: { include: { tag: true } },
      tracks: { orderBy: { position: 'asc' } },
      _count: { select: { likes: true } },
    },
  });
  if (!p) return notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const isOwner = userId === p.ownerId || userId === p.owner?.id;

  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const share = `${proto}://${host}/p/${p.id}`;

  return (
    <main className="p-8 space-y-4 max-w-3xl">
      <Link className="underline text-sm" href="/dashboard">Back to your dashboard</Link>
      <h1 className="text-3xl font-bold">{p.title}</h1>
      <div className="text-sm text-gray-500">
        by {p.owner.handle} · {p.isPublic ? 'Public' : 'Private'}
      </div>
      {p.coverUrl ? (
        <img src={p.coverUrl} alt="" className="w-full max-w-md rounded object-cover border" />
      ) : null}
      {p.description ? <p className="text-gray-200">{p.description}</p> : null}
      {p.links.length ? (
        <div className="flex flex-wrap gap-2">
          {p.links.map(l => (
            <span key={l.tagId} className="text-xxs px-2 py-0.5 rounded bg-gray-800 text-gray-200">
              {l.tag.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="text-sm text-gray-500">Share: <span className="underline">{share}</span></div>
      <section className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Tracks ({p.tracks.length})</h2>

        {p.tracks.length === 0 ? (
          <p className="text-white/60">No tracks yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 border border-white/10 rounded">
            {p.tracks.map((t, idx) => (
              <li key={t.id} className="p-3 flex items-center gap-4">
                <span className="w-6 text-right text-white/50">{idx + 1}</span>

                <div className="flex-1 min-w-0">
                  <div className="truncate">{t.title}</div>
                  <div className="text-xs text-white/50 truncate">
                    {t.artist ?? 'Unknown artist'}
                    {t.bpm ? ` · ${t.bpm} BPM` : ''}
                    {t.key ? ` · ${t.key}` : ''}
                  </div>
                </div>

                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs rounded px-3 py-1.5 bg-white text-black hover:bg-gray-200"
                >
                  Open
                </a>
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          <div className="pt-4 border-t border-white/10">
            <h3 className="font-semibold mb-3">Add a track</h3>
            <AddTrackForm playlistId={p.id} />
          </div>
        )}
      </section>
    </main>
  );
}
