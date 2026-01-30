import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import LikeButton from '@/components/LikeButton';

export const dynamic = 'force-dynamic';

export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params; // Next 16: params is a Promise

  const user = await prisma.user.findUnique({
    where: { handle },
    select: { id: true, handle: true },
  });

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">User not found</h1>
        <p className="text-white/60">No account for @{handle}</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const viewerId = data.user?.id ?? null;

  const playlists = await prisma.playlist.findMany({
    where: { ownerId: user.id, isPublic: true },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      _count: { select: { likes: true } },
      likes: { where: { userId: viewerId ?? '____no_user____' }, select: { id: true } },
    },
  });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">@{user.handle}</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((p) => (
          <li key={p.id} className="rounded border border-white/10 p-4">
            <div className="flex items-start gap-3">
              {p.coverUrl ? (
                <Image
                  src={p.coverUrl}
                  alt={`${p.title} cover`}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-16 h-16 rounded bg-white/5 border border-white/10 grid place-items-center text-[10px] text-white/50 flex-shrink-0">
                  no cover
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/p/${p.id}`} className="block">
                  <div className="font-medium truncate">{p.title}</div>
                </Link>
              </div>
              <LikeButton
                playlistId={p.id}
                initialCount={p._count.likes}
                initiallyLiked={(p.likes?.length ?? 0) > 0}
              />
            </div>
          </li>
        ))}
      </ul>
      {!playlists.length && (
        <p className="text-white/60">No public playlists yet.</p>
      )}
    </main>
  );
}
