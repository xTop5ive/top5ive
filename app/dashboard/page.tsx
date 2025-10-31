import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import CopyButton from '@/components/CopyButton';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-8">
        <p>Not signed in. <Link className="underline" href="/sign-in">Sign in</Link></p>
      </main>
    );
  }

  const playlists = await prisma.playlist.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { links: { include: { tag: true } } },
  });

  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Your playlists</h1>

      <form className="flex flex-wrap items-center gap-2" action="/api/playlists" method="post">
        <input name="title" placeholder="Playlist title" className="border px-3 py-2 rounded" />
        <input name="description" placeholder="Description (optional)" className="border px-3 py-2 rounded w-56" />
        <input name="source" placeholder="YouTube/Spotify link (optional)" className="border px-3 py-2 rounded w-64" />
        <input name="tags" placeholder="Tags (comma-separated)" className="border px-3 py-2 rounded w-56" />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublic" />
          <span>Public</span>
        </label>
        <button className="px-4 py-2 rounded bg-black text-white">Create</button>
      </form>

      <ul className="space-y-3">
        {playlists.map(p => {
          const link = `${origin}/p/${p.id}`;
          return (
            <li key={p.id} className="border rounded p-3 flex gap-3 items-start">
              <Link href={`/p/${p.id}`} className="shrink-0">
                {p.coverUrl ? (
                  <img src={p.coverUrl} alt="" className="w-16 h-16 rounded object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-400">no cover</div>
                )}
              </Link>

              <div className="flex-1">
                <div className="font-medium">
                  <Link href={`/p/${p.id}`} className="hover:underline">{p.title}</Link>
                </div>
                <div className="text-sm text-gray-600">{p.description ?? 'No description yet'}</div>

                {p.links?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.links.map(l => (
                      <span key={l.tagId} className="text-xxs px-2 py-0.5 rounded bg-gray-800 text-gray-200">
                        {l.tag.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="text-xs mt-2 flex items-center gap-3">
                  {p.isPublic ? 'Public' : 'Private'} · <Link className="underline" href={`/p/${p.id}`}>View</Link>
                  {p.isPublic && <CopyButton text={link} className="text-xs px-2 py-1 rounded border" />}
                </div>

                {/* Upload cover */}
                <form className="mt-3 flex items-center gap-2" action={`/api/playlists/${p.id}/cover`} method="post" encType="multipart/form-data">
                  <input type="file" name="cover" accept="image/jpeg,image/png,image/webp" className="text-xs w-auto" required />
                  <button className="px-3 py-1 rounded border text-xs">Upload cover</button>
                  <span className="text-[10px] text-gray-500">(JPG/PNG/WebP, ≤ 3 MB; auto 1024×1024)</span>
                </form>
              </div>
            </li>
          );
        })}
      </ul>

      <Link className="underline" href="/sign-out">Sign out</Link>
    </main>
  );
}
