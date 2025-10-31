'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function SignOut() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.signOut().finally(() => router.replace('/'));
  }, [supabase, router]);

  return <main className="p-8">Signing you out…</main>;
}
