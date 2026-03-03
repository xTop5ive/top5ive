import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(req.url);

  if (error) {
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url));
  }

  return NextResponse.redirect(new URL(next, url));
}