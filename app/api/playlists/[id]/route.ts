import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

// DELETE /api/playlists/:id
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 16: params may be a Promise
) {
  const { id } = await ctx.params;

  // must be signed in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // must own the playlist
  const pl = await prisma.playlist.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!pl) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (pl.ownerId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // clean up joins first (if you don't have cascades)
  await prisma.playlistTag.deleteMany({ where: { playlistId: id } });
  await prisma.like.deleteMany({ where: { playlistId: id } });
  await prisma.playlist.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
