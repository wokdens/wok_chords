export const prerender = true;

import { getAllSongs } from '../lib/songStore';
import { slugify } from '../lib/slugify';

export async function GET() {
  const baseUrl = 'https://wokchords.wokdens.com';
  const now = new Date().toISOString().split('T')[0];
  const songs = getAllSongs();

  const artistMap = new Map<string, string>();
  for (const song of songs) {
    const artistName = song.artist || 'Unknown Artist';
    const artistSlug = slugify(artistName);
    if (!artistMap.has(artistSlug)) {
      artistMap.set(artistSlug, artistName);
    }
  }

  const artists = Array.from(artistMap.keys());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${artists
  .map(
    (slug) => `  <url>
    <loc>${baseUrl}/artist/${slug}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
