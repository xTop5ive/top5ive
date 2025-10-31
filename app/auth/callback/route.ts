import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = await createClient();               // await the async cookies() client
  const { error } = await supabase.auth.exchangeCodeForSession(request.url); // pass full URL

  if (error) {
    const url = new URL('/', request.url);
    url.searchParams.set('auth_error', error.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
