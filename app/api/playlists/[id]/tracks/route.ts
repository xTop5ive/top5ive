// app/api/playlists/[id]/tracks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // Correct for Next.js 15/16
) {
  const { id } = await ctx.params;

  // 1. Auth Check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // 2. Ownership Check (Efficient: select only what you need)
  const pl = await prisma.playlist.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!pl) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  if (pl.ownerId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // 3. Robust Body Parsing
  let body: any = {};
  const ct = req.headers.get('content-type') || '';
  
  if (ct.includes('application/json')) {
    body = await req.json();
  } else {
    const form = await req.formData();
    body = Object.fromEntries(form.entries()); // Cleaner form-data parsing
  }

  const title = String(body.title ?? '').trim();
  const url = String(body.url ?? '').trim();

  // 4. Input Validation
  if (!title || !url) {
    return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 });
  }
  
  try {
    new URL(url); // valid URL check
  } catch (e) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  // 5. Position Logic
  // If manual position provided, use it. Otherwise, calc next.
  let position: number;
  
  if (body.position && !isNaN(Number(body.position))) {
    position = Number(body.position);
  } else {
    // Find last track
    const lastTrack = await prisma.track.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    position = (lastTrack?.position ?? 0) + 1;
  }

  // 6. Execution
  try {
    const track = await prisma.track.create({
      data: {
        playlistId: id,
        title,
        url,
        artist: body.artist ? String(body.artist).trim() : null,
        bpm: body.bpm ? Number(body.bpm) : null,
        key: body.key ? String(body.key).trim() : null,
        position,
      },
    });

    return NextResponse.json({ ok: true, track }, { status: 201 });
  } catch (error) {
    console.error('Prisma Error:', error);
    return NextResponse.json(
      { error: 'Failed to create track. ensure Prisma Client is generated.' }, 
      { status: 500 }
    );
  }
}