import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { getCoverFromLink } from '@/lib/cover';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url));

  const form = await request.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const isPublic = form.get('isPublic') === 'on';
  const source = String(form.get('source') || '').trim();
  const rawTags = String(form.get('tags') || ''); // "chill, r&b, study"

  if (!title) return NextResponse.redirect(new URL('/dashboard', request.url));

  // optional cover
  let coverUrl: string | null = null;
  if (source) coverUrl = await getCoverFromLink(source);

  // create playlist first
  const playlist = await prisma.playlist.create({
    data: {
      title,
      description: description || null,
      isPublic,
      ownerId: user.id,
      coverUrl: coverUrl || null,
    }
  });

  // parse tags, lowercase, trim, dedupe
  const tagNames = Array.from(new Set(
    rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  ));

  // upsert each tag and link it
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: { usage: { increment: 1 } },
      create: { name, usage: 1 },
    });
    // connect in join table
    await prisma.playlistTag.upsert({
      where: { playlistId_tagId: { playlistId: playlist.id, tagId: tag.id } },
      update: {},
      create: { playlistId: playlist.id, tagId: tag.id },
    });
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
