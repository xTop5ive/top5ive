import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import LikeButton from '@/components/LikeButton';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type SP = { [k: string]: string | string[] | undefined };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  // Next 16: searchParams is a Promise
  const sp = await searchParams;

  const qRaw = typeof sp?.q === 'string' ? sp.q : '';
  const q = qRaw.trim();

  const tagsParam = typeof sp?.tags === 'string' ? sp.tags : '';
  const tagNames = tagsParam
    ? tagsParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const sortParam = typeof sp?.sort === 'string' ? sp.sort : '';
  const sort: 'new' | 'top' = sortParam === 'top' ? 'top' : 'new';

  // current user (for pre-marking likes)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  // filters
  const where: any = { isPublic: true };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { owner: { is: { handle: { contains: q, mode: 'insensitive' } } } },
    ];
  }
  if (tagNames.length) {
    // join/filter via your PlaylistTag relation alias "links"
    where.links = { some: { tag: { name: { in: tagNames } } } };
  }

  const playlists = await prisma.playlist.findMany({
    where,
    orderBy:
      sort === 'top'
        ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
    take: 24,
    include: {
      owner: { select: { handle: true } },
      _count: { select: { likes: true } },
      likes: { where: { userId: userId ?? '____no_user____' }, select: { id: true } },
      links: { include: { tag: true } }, // Tag chips
    },
  });

  return (
    <main className="max-w-5xl mx-auto p-6">
      {/* Search */}
      <form className="mb-4 flex gap-2" action="/explore">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, description, or @handle"
          className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
        />
        <input type="hidden" name="tags" value={tagNames.join(',')} />
        <input type="hidden" name="sort" value={sort} />
        <button className="rounded bg-white/10 px-4 py-2">Search</button>
      </form>

      {/* Sort switch */}
      <div className="mb-4 flex items-center gap-3 text-sm">
        <span className="text-white/60">Sort:</span>
        {(() => {
          const mk = (s: 'new' | 'top') => {
            const p = new URLSearchParams();
            if (q) p.set('q', q);
            if (tagNames.length) p.set('tags', tagNames.join(','));
            p.set('sort', s);
            return `/explore?${p.toString()}`;
          };
          return (
            <>
              <Link
                href={mk('new')}
                className={`px-3 py-1 rounded border border-white/10 ${
                  sort === 'new' ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                Newest
              </Link>
              <Link
                href={mk('top')}
                className={`px-3 py-1 rounded border border-white/10 ${
                  sort === 'top' ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                Most liked
              </Link>
            </>
          );
        })()}
      </div>

      {/* Active tag filters */}
      {tagNames.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/60">Filters:</span>
          {Array.from(new Set(tagNames)).map((t) => {
            const remaining = tagNames.filter((x) => x !== t);
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (remaining.length) params.set('tags', remaining.join(','));
            params.set('sort', sort);
            const href = `/explore?${params.toString()}`;
            return (
              <Link
                key={t}
                href={href}
                className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20"
              >
                #{t} ✕
              </Link>
            );
          })}
          <Link
            href={`/explore?sort=${sort}`}
            className="ml-2 underline text-white/70 hover:text-white"
          >
            Clear filters
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Latest public playlists</h1>
        <a
          href="/new"
          className="text-sm rounded border border-white/15 px-3 py-1 hover:bg-white/10"
        >
          New playlist
        </a>
      </div>

      {/* Cards */}
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
                  {p.description && (
                    <div className="text-sm text-white/60 line-clamp-2">
                      {p.description}
                    </div>
                  )}
                </Link>

                {p.owner?.handle && (
                  <div className="mt-1 text-xs text-white/60">
                    by{' '}
                    <Link
                      className="underline hover:text-white"
                      href={`/u/${p.owner.handle}`}
                    >
                      @{p.owner.handle}
                    </Link>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1">
                  {p.links?.map((l: any, i: number) => {
                    const tag = l.tag.name.toLowerCase();
                    const nextSet = Array.from(new Set([...(tagNames || []), tag]));
                    const params = new URLSearchParams();
                    if (q) params.set('q', q);
                    if (nextSet.length) params.set('tags', nextSet.join(','));
                    params.set('sort', sort);
                    const href = `/explore?${params.toString()}`;
                    return (
                      <Link
                        key={`${l.id ?? tag}-${i}`}
                        href={href}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20"
                      >
                        {l.tag.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <LikeButton
                  playlistId={p.id}
                  initialCount={p._count.likes}
                  initiallyLiked={(p.likes?.length ?? 0) > 0}
                />
                <ShareButton href={`/p/${p.id}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!playlists.length && (
        <p className="text-white/60">No public playlists match your filters yet.</p>
      )}
    </main>
  );
}