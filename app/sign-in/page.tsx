'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function SignIn() {
  const supabase = createClient();
  const router = useRouter();

  // When the email link brings you back with ?code=..., trade it for a session here
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
      supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
        if (error) alert(error.message);
        router.replace('/'); // clean the URL
      });
    }
  }, [supabase, router]);

  async function signInWithEmail() {
    const email = prompt('Enter your email for a magic link:') || '';
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/sign-in` }
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
