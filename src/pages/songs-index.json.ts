export const prerender = true;

import { getAllSongs } from '../lib/songStore';

export async function GET() {
  const songs = getAllSongs();

  // Compact tuple format: [slug, title, artist, movie, key, tags]
  const rows = songs.map((s) => [
    s.slug,
    s.title,
    s.artist,
    s.movie || '',
    s.key || '',
    s.tags && s.tags.length > 0 ? s.tags.slice(0, 2) : [],
  ]);

  return Response.json(rows, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
