import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg','image/png','image/webp']);

// Optional: avoid 405 noise when the browser hits this with GET
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.redirect(new URL('/dashboard', req.url));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;  // ✅ Next 16: await params

  // auth + ownership
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/sign-in', req.url));

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist || playlist.ownerId !== user.id) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });
  }

  // read file
  const form = await req.formData();
  const file = form.get('cover') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const inputBuf = Buffer.from(await file.arrayBuffer());
  if (inputBuf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 3 MB)' }, { status: 400 });
  }

  // sniff + validate
  const ft = await fileTypeFromBuffer(inputBuf);
  const mime = ft?.mime || file.type || '';
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WebP allowed' }, { status: 400 });
  }

  // normalize to 1024x1024 webp
  const outBuf = await sharp(inputBuf, { failOn: 'none', limitInputPixels: 4000*4000 })
    .resize(1024, 1024, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  // upload -> Supabase Storage (bucket: covers)
  const folder = `${user.id}/${playlist.id}`;
  const filename = `cover-${Date.now()}.webp`;     // good;
  const path = `${folder}/${filename}`;

  const up = await supabaseAdmin.storage.from('covers').upload(path, outBuf, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true
  });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from('covers').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  await prisma.playlist.update({
    where: { id: playlist.id },
    data: { coverUrl: publicUrl, updatedAt: new Date() }
  });

  // clean old covers in that folder
  const listed = await supabaseAdmin.storage.from('covers').list(folder);
  const oldPaths = (listed.data || [])
    .map(o => `${folder}/${o.name}`)
    .filter(p => p !== path);
  if (oldPaths.length) await supabaseAdmin.storage.from('covers').remove(oldPaths);

  return NextResponse.redirect(new URL('/dashboard', req.url));
}
