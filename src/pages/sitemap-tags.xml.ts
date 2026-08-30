export const prerender = true;

import { getAllSongs } from '../lib/songStore';
import { slugify } from '../lib/slugify';

export async function GET() {
  const baseUrl = 'https://wokchords.wokdens.com';
  const now = new Date().toISOString().split('T')[0];
  const songs = getAllSongs();

  const tagSet = new Set<string>();
  for (const song of songs) {
    if (Array.isArray(song.tags)) {
      for (const t of song.tags) {
        if (t) tagSet.add(slugify(t));
      }
    }
  }

  const tags = Array.from(tagSet);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tags
  .map(
    (tag) => `  <url>
    <loc>${baseUrl}/tag/${tag}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
