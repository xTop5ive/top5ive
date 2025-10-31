import Link from 'next/link';
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 space-y-4">
      <h1 className="text-4xl font-bold">Top5ive 🎶</h1>
      <p className="text-gray-600">Share playlists. Build together. Discover new sounds.</p>
      <div className="flex gap-4">
        <Link href="/explore" className="underline">Explore</Link>
        <Link href="/dashboard" className="underline">Dashboard</Link>
        <Link href="/sign-in" className="underline">Sign in</Link>
      </div>
    </main>
  );
}
