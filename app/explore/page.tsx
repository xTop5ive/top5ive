import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function Explore() {
  const playlists = await prisma.playlist.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { owner: true },
  });

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Latest public playlists</h1>
      <ul className="space-y-3">
        {playlists.map(p => (
          <li key={p.id} className="border rounded p-3">
            <div className="font-medium">
              <Link className="underline" href={`/p/${p.id}`}>{p.title}</Link>
            </div>
            <div className="text-sm text-gray-600">
              by {p.owner?.handle ?? 'unknown'}
            </div>
            {p.description && <div className="text-sm">{p.description}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
