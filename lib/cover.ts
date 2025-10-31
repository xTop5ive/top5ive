export async function getCoverFromLink(link: string): Promise<string | null> {
  try {
    const u = new URL(link);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (host.endsWith('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) {
        return `https://img.youtube.com/vi/${parts[1]}/hqdefault.jpg`;
      }
    }

    // Spotify oEmbed (no auth)
    if (host.endsWith('open.spotify.com')) {
      const resp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`);
      if (!resp.ok) return null;
      const data = await resp.json() as any;
      return data?.thumbnail_url ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
