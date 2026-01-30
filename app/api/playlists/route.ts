import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { getCoverFromLink } from '@/lib/cover';

function norm(t: string) {
  return t
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 &-]/gi, '')
    .slice(0, 24);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/sign-in', request.url));

  const form = await request.formData();
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim();
  const isPublic = form.get('isPublic') === 'on';
  const source = String(form.get('source') || '').trim();
  const rawTags = String(form.get('tags') || '');

  if (!title) return NextResponse.redirect(new URL('/dashboard', request.url));

  let coverUrl: string | null = null;
  if (source) coverUrl = await getCoverFromLink(source);

  // normalize, dedupe, limit
  const tagNames = Array.from(
    new Set(
      rawTags
        .split(',')
        .map(norm)
        .filter(Boolean)
    )
  ).slice(0, 8);

  await prisma.$transaction(async (tx) => {
    const playlist = await tx.playlist.create({
      data: {
        title,
        description: description || null,
        isPublic,
        ownerId: user.id,
        coverUrl: coverUrl || null,
      },
    });

    if (tagNames.length) {
      const tags = await Promise.all(
        tagNames.map((name) =>
          tx.tag.upsert({
            where: { name },
            update: { usage: { increment: 1 } },
            create: { name, usage: 1 },
          })
        )
      );

      await tx.playlistTag.createMany({
        data: tags.map((t) => ({
          playlistId: playlist.id,
          tagId: t.id,
        })),
        skipDuplicates: true,
      });
    }
  });

  // 303 avoids resubmitting the form on back/refresh
  return NextResponse.redirect(new URL(`/p/${playlist.id}?created=1`, request.url));
}