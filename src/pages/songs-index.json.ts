export const prerender = true;

import { getAllSongs } from '../lib/songStore';

export async function GET() {
  const songs = getAllSongs();

  const rows = songs.map((s) => ({
    slug: s.slug,
    title: s.title,
    artist: s.artist,
    movie: s.movie || undefined,
    key: s.key || undefined,
    tags: s.tags?.length > 0 ? s.tags.slice(0, 2) : undefined,
    snippet: s.snippet ? s.snippet.slice(0, 60).trim() : undefined,
  }));

  return Response.json(rows, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
