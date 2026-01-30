import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Next 16: params is a Promise
  const { id } = await params;
  const playlistId = id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Toggle like without relying on a composite-unique name
  const existing = await prisma.like.findFirst({
    where: { playlistId, userId: user.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { playlistId, userId: user.id } });
  }

  const count = await prisma.like.count({ where: { playlistId } });
  return NextResponse.json({ liked: !existing, count });
}
