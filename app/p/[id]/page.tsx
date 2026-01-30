import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DeleteButton from '@/components/DeleteButton';
import { createClient } from '@/lib/supabase-server';

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const p = await prisma.playlist.findUnique({
    where: { id },
    include: { owner: true, links: { include: { tag: true } } },
  });
  if (!p) return notFound();

  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const share = `${proto}://${host}/p/${p.id}`;

  return (
    <main className="p-8 space-y-4 max-w-3xl">
      <Link className="underline text-sm" href="/dashboard">Back to your dashboard</Link>
      <h1 className="text-3xl font-bold">{p.title}</h1>
      <div className="text-sm text-gray-500">
        by {p.owner.handle} · {p.isPublic ? 'Public' : 'Private'}
      </div>
      {p.coverUrl ? (
        <img src={p.coverUrl} alt="" className="w-full max-w-md rounded object-cover border" />
      ) : null}
      {p.description ? <p className="text-gray-200">{p.description}</p> : null}
      {p.links.length ? (
        <div className="flex flex-wrap gap-2">
          {p.links.map(l => (
            <span key={l.tagId} className="text-xxs px-2 py-0.5 rounded bg-gray-800 text-gray-200">
              {l.tag.name}
            </span>
          ))}
        </div>
      ) : null}
      <div className="text-sm text-gray-500">Share: <span className="underline">{share}</span></div>
    </main>
  );
}
