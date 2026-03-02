'use client';

import { createClient } from '@/lib/supabase-browser';

export default function SignIn() {
  const supabase = createClient();

  async function signInWithEmail() {
    const email = prompt('Enter your email for a magic link:') || '';
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // IMPORTANT: send users to the SERVER callback route
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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