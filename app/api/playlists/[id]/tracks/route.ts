import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

// quick provider parser (no external API calls needed)
function parseSource(rawUrl: string): { source: 'youtube' | 'spotify' | 'link', externalId?: string } {
  try {
    const url = new URL(rawUrl);

    // YouTube
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v') || undefined;
      return { source: 'youtube', externalId: id };
    }
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1) || undefined;
      return { source: 'youtube', externalId: id };
    }

    // Spotify
    if (url.hostname.includes('open.spotify.com') && url.pathname.startsWith('/track/')) {
      const id = url.pathname.split('/')[2] || undefined;
      return { source: 'spotify', externalId: id };
    }

    // Fallback: just a generic link
    return { source: 'link' };
  } catch {
    return { source: 'link' };
  }
}

// POST /api/playlists/:id/tracks
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // ownership
  const pl = await prisma.playlist.findUnique({ where: { id }, select: { ownerId: true } });
  if (!pl) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (pl.ownerId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // read form
  const form = await request.formData();
  const url = String(form.get('url') || '').trim();
  const title = String(form.get('title') || '').trim();
  const artist = String(form.get('artist') || '').trim();

  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'missing title' }, { status: 400 });

  // figure out provider + external id
  const parsed = parseSource(url);

  // next position
  const agg = await prisma.track.aggregate({
    where: { playlistId: id },
    _max: { position: true },
  });
  const nextPos = (agg._max.position ?? 0) + 1;

  // insert
  const t = await prisma.track.create({
    data: {
      playlistId: id,
      source: parsed.source,
      externalId: parsed.externalId ?? null,
      url,
      title,
      artist: artist || null,
      position: nextPos,
      addedBy: user.id,
    },
  });

  return NextResponse.json({ ok: true, id: t.id });
}
