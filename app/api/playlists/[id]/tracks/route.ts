import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: playlistId } = await ctx.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { ownerId: true },
  });
  if (!playlist) return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  if (playlist.ownerId !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const body = await req.json();
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  const artist = body.artist ? String(body.artist).trim() : null;
  const key = body.key ? String(body.key).trim() : null;

  const bpmNum = body.bpm === "" || body.bpm == null ? null : Number(body.bpm);
  const bpm = Number.isFinite(bpmNum) ? Math.max(0, Math.floor(bpmNum)) : null;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const last = await prisma.track.findFirst({
    where: { playlistId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = (last?.position ?? 0) + 1;

  const track = await prisma.track.create({
    data: { playlistId, title, url, artist, bpm, key, position },
  });

  return NextResponse.json({ ok: true, track });
}