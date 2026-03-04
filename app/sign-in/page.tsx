'use client';

import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="max-w-md mx-auto">
        <div className="card p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-white/60 mt-2">
            Demo mode: auth is disabled while we finish the UI.
          </p>

          <div className="mt-6 space-y-3">
            <Link href="/explore" className="btn btnPrimary w-full text-center">
              Continue as Guest
            </Link>

            <button className="btn w-full" disabled>
              Continue with Email (coming soon)
            </button>
          </div>

          <div className="mt-6 text-sm text-white/60">
            <Link href="/explore" className="underline hover:text-white">
              Go to Explore
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}