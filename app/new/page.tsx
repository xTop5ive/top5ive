import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import TagInput from '@/components/TagInput';

export const dynamic = 'force-dynamic';

function normTag(t: string) {
  return t
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 &-]/gi, '')
    .slice(0, 24);
}

async function createPlaylist(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in?next=/new');

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const isPublic = formData.get('isPublic') === 'on';
  const file = formData.get('cover') as File | null;   // optional file cover
  const rawTags = String(formData.get('tags') || '');  // "trap, r&b, study"

  if (!title) throw new Error('Title is required');

  // 1) create playlist first
  const playlist = await prisma.playlist.create({
    data: {
      title,
      description: description || null,
      isPublic,
      ownerId: user.id,
    },
    select: { id: true },
  });

  // 2) optional cover upload to Supabase Storage "covers" bucket
  if (file && file.size > 0) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${playlist.id}-${Date.now()}.${ext}`;
  
    // upload to covers bucket
    const { error: upErr } = await supabase.storage
      .from('covers')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined,
      });
  
    if (!upErr) {
      const { data } = supabase.storage.from('covers').getPublicUrl(path);
      if (data?.publicUrl) {
        await prisma.playlist.update({
          where: { id: playlist.id },
          data: { coverUrl: data.publicUrl },
        });
      }
    } else {
      // helps you debug in dev
      console.error('upload error', upErr);
    }
  }

  // 3) parse & save tags
  const tagNames = Array.from(
    new Set(
      rawTags
        .split(',')
        .map(normTag)
        .filter(Boolean)
    )
  ).slice(0, 8);

  if (tagNames.length) {
    const tags = await Promise.all(
      tagNames.map((name) =>
        prisma.tag.upsert({
          where: { name },
          update: { usage: { increment: 1 } },
          create: { name, usage: 1 },
        })
      )
    );

    // join table links
    await prisma.playlistTag.createMany({
      data: tags.map((t) => ({ playlistId: playlist.id, tagId: t.id })),
      skipDuplicates: true,
    });
  }

  redirect(`/p/${playlist.id}`);
}

export default async function NewPlaylistPage() {
  const supabase = await createClient();
  const { data: { user} } = await supabase.auth.getUser();

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">New Playlist</h1>
      {!user ? (
        <p><a className="underline" href="/sign-in">Sign in</a> to create a playlist.</p>
      ) : (
        <form action={createPlaylist} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              name="title"
              required
              placeholder="My Vibes"
              className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Description (optional)</label>
            <textarea
              name="description"
              rows={3}
              placeholder="What this playlist feels like…"
              className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" defaultChecked /> Public
          </label>

          <div>
            <label className="block text-sm mb-1">Tags</label>
            <TagInput name="tags" max={8} />
          </div>

          <div>
            <label className="block text-sm mb-1">Cover image (optional)</label>
            <input type="file" name="cover" accept="image/*" className="block w-full text-sm" />
            <p className="text-xs text-white/60 mt-1">PNG/JPEG/WebP, ~≤ 2MB is ideal.</p>
          </div>

          <button className="rounded bg-white/10 px-4 py-2">Create</button>
        </form>
      )}
    </main>
  );
}