import Link from "next/link";
import Container from "@/components/Container";
import { DEMO_PLAYLISTS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

function buildExploreHref(opts: { q?: string; tags?: string[]; sort?: "new" | "top" }) {
  const p = new URLSearchParams();
  if (opts.q) p.set("q", opts.q);
  if (opts.tags && opts.tags.length) p.set("tags", opts.tags.join(","));
  if (opts.sort) p.set("sort", opts.sort);
  const qs = p.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const qRaw = typeof sp?.q === "string" ? sp.q : "";
  const q = qRaw.trim();
  const qLower = q.toLowerCase();

  const tagsParam = typeof sp?.tags === "string" ? sp.tags : "";
  const tagNames = tagsParam
    ? tagsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const sortParam = typeof sp?.sort === "string" ? sp.sort : "";
  const sort: "new" | "top" = sortParam === "top" ? "top" : "new";

  const playlists = DEMO_PLAYLISTS
    .filter((p) => p.isPublic)
    .filter((p) => {
      if (!qLower) return true;
      const hay = `${p.title} ${p.description ?? ""} ${p.handle}`.toLowerCase();
      return hay.includes(qLower);
    })
    .filter((p) => {
      if (!tagNames.length) return true;
      const set = new Set(p.tags.map((t) => t.toLowerCase()));
      return tagNames.every((t) => set.has(t));
    })
    .sort((a, b) => {
      if (sort === "top") return b.likes - a.likes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 24);

  const quickTags = ["r&b", "rap", "trap", "afrobeats", "austin", "late-night", "texas", "vibes"];

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Explore</h1>
        <p className="text-white/60 mt-1">
          Find playlists by vibe, tags, or creator.
        </p>
      </div>

      <div className="card p-4 mb-6">
        <form className="flex flex-col md:flex-row gap-3" action="/explore">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title, description, or @handle"
            className="input flex-1"
          />
          <input type="hidden" name="tags" value={tagNames.join(",")} />
          <input type="hidden" name="sort" value={sort} />
          <button className="btn btnPrimary md:w-auto">Search</button>
        </form>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-white/60">Sort:</span>
          <Link
            href={buildExploreHref({ q, tags: tagNames, sort: "new" })}
            className={`btn px-3 py-1.5 ${sort === "new" ? "bg-white/15" : ""}`}
          >
            Newest
          </Link>
          <Link
            href={buildExploreHref({ q, tags: tagNames, sort: "top" })}
            className={`btn px-3 py-1.5 ${sort === "top" ? "bg-white/15" : ""}`}
          >
            Most liked
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickTags.map((t) => {
            const nextSet = Array.from(new Set([...(tagNames || []), t]));
            return (
              <Link
                key={t}
                href={buildExploreHref({ q, tags: nextSet, sort })}
                className="pill text-sm"
              >
                #{t}
              </Link>
            );
          })}
        </div>

        {tagNames.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/60">Filters:</span>
            {Array.from(new Set(tagNames)).map((t) => {
              const remaining = tagNames.filter((x) => x !== t);
              return (
                <Link
                  key={t}
                  href={buildExploreHref({ q, tags: remaining, sort })}
                  className="pill"
                >
                  #{t} ✕
                </Link>
              );
            })}
            <Link href={buildExploreHref({ sort })} className="ml-2 underline text-white/70 hover:text-white">
              Clear filters
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Latest public playlists</h2>
          <p className="text-white/60 text-sm mt-1">Showing {playlists.length} results</p>
        </div>
        <Link href="/new" className="btn btnPrimary text-sm">New playlist</Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((p) => (
          <div key={p.id} className="card p-4 hover:border-white/20 transition shadow-soft">
            <div className="flex gap-3">
              <Link
                href={`/p/${p.id}`}
                className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0"
                aria-label={`Open ${p.title}`}
              >
                {p.coverUrl ? (
                  <img
                    src={p.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-[10px] text-white/60">no cover</div>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/p/${p.id}`} className="font-semibold truncate hover:underline block">
                      {p.title}
                    </Link>
                    {p.description && (
                      <div className="text-sm text-white/60 line-clamp-2">{p.description}</div>
                    )}
                    <div className="text-xs text-white/50 mt-1">by {p.handle}</div>
                  </div>

                  <div className="text-sm text-white/70 flex items-center gap-1 flex-shrink-0">
                    <span>♥</span>
                    <span>{p.likes}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 6).map((t) => {
                    const tag = t.toLowerCase();
                    const nextSet = Array.from(new Set([...(tagNames || []), tag]));
                    const href = buildExploreHref({ q, tags: nextSet, sort });
                    return (
                      <Link
                        key={`${p.id}-${t}`}
                        href={href}
                        className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80 hover:bg-white/15 border border-white/10"
                      >
                        {t}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!playlists.length && (
        <p className="text-white/60">No public playlists match your filters yet.</p>
      )}
    </Container>
  );
}