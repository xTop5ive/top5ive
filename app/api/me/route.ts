import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ user: null, error: error.message }, { status: 200 });
  }
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  let profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) {
    const handle = `user_${user.id.slice(0, 6)}`;
    profile = await prisma.profile.create({
      data: { id: user.id, handle, name: user.email || 'New User' }
    });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile
  });
}
