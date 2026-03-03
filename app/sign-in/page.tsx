'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function SignIn() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // If the magic link brought us back with a code, exchange it for a session
    if (code) {
      (async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          alert(error.message);
          return;
        }

        // clean URL + go where you want
        router.replace('/dashboard');
      })();
    }
  }, [supabase, router]);

  async function signInWithEmail() {
    const email = prompt('Enter your email for a magic link:') || '';
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // keep it on /sign-in so the same page can read ?code=
        emailRedirectTo: `${window.location.origin}/sign-in`,
      },
    });

    if (error) alert(error.message);
    else alert('Check your email for the link');
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <button
        onClick={signInWithEmail}
        className="mt-4 px-4 py-2 rounded bg-black text-white"
      >
        Continue with email
      </button>
    </main>
  );
}