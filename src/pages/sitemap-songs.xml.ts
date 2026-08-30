export const prerender = true;

import { getAllSongs } from '../lib/songStore';

export async function GET() {
  const baseUrl = 'https://wokchords.wokdens.com';
  const now = new Date().toISOString().split('T')[0];
  const songs = getAllSongs();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${songs
  .map(
    (s) => `  <url>
    <loc>${baseUrl}/song/${s.slug}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
